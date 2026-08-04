import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { CouponService } from '../../coupon/application/coupon.service';
import { PaymentService } from '../../payment/application/payment.service';
import { Payment, PaymentMethod } from '../../payment/domain/payment.entity';
import { ProductService } from '../../product/application/product.service';
import { SkuNotFoundError } from '../../product/domain/sku.errors';
import { OrderAmounts } from '../domain/order-amounts';
import { OrderItem } from '../domain/order-item.entity';
import { Order, OrderReceiver } from '../domain/order.entity';
import {
  DuplicateIdempotencyKeyError,
  OrderNotFoundError,
} from '../domain/order.errors';
import {
  OrderListFilter,
  OrderListResult,
  OrderRepository,
} from '../domain/order.repository';

export interface CreateOrderInput {
  idempotencyKey: string;
  items: { skuId: string; quantity: number }[];
  couponId: string | null;
  receiver: OrderReceiver;
  paymentMethod: PaymentMethod;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
    private readonly productService: ProductService,
    private readonly couponService: CouponService,
  ) {}

  async createOrder(
    userId: string,
    input: CreateOrderInput,
  ): Promise<{ order: Order; payment: Payment }> {
    const existing = await this.orderRepository.findByIdempotencyKey(
      userId,
      input.idempotencyKey,
    );
    if (existing) {
      const payment = await this.paymentService.getPaymentByOrderId(
        existing.id,
      );
      return { order: existing, payment };
    }

    let placed: { order: Order; payment: Payment };
    try {
      placed = await this.placeOrder(userId, input);
    } catch (error) {
      if (!(error instanceof DuplicateIdempotencyKeyError)) {
        throw error;
      }
      const duplicated = await this.orderRepository.findByIdempotencyKey(
        userId,
        input.idempotencyKey,
      );
      if (!duplicated) {
        throw error;
      }
      const payment = await this.paymentService.getPaymentByOrderId(
        duplicated.id,
      );
      return { order: duplicated, payment };
    }

    if (placed.payment.method === PaymentMethod.PAY_MONEY) {
      try {
        const order = await this.confirmPayment(placed.order.id, userId);
        return { order, payment: placed.payment };
      } catch (error) {
        await this.compensateFailure(placed.order.id, userId);
        throw error;
      }
    }
    return placed;
  }

  @Transactional()
  async cancelOrder(
    orderId: string,
    userId: string,
  ): Promise<{ order: Order; refundAmount: number }> {
    const order = await this.orderRepository.findByIdAndUserIdForUpdate(
      orderId,
      userId,
    );
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    order.cancel();
    await this.orderRepository.save(order);
    await this.restoreStockAndCoupon(order);
    const refundAmount = await this.paymentService.cancelPayment(
      orderId,
      userId,
    );
    return { order, refundAmount };
  }

  async getOrders(
    userId: string,
    filter: OrderListFilter,
  ): Promise<OrderListResult> {
    return this.orderRepository.findPageByUser(userId, filter);
  }

  async getOrderDetail(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findWithItemsByIdAndUserId(
      orderId,
      userId,
    );
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }

  @Transactional()
  private async placeOrder(
    userId: string,
    input: CreateOrderInput,
  ): Promise<{ order: Order; payment: Payment }> {
    const coupon = input.couponId
      ? await this.couponService.getCoupon(input.couponId, userId)
      : null;
    const items = await this.createOrderItemSnapshots(input.items);
    const amounts = OrderAmounts.create({
      lineAmounts: items.map((item) => item.lineAmount()),
      couponDiscount: coupon ? coupon.discountAmount : 0,
    });
    const order = Order.create({
      userId,
      idempotencyKey: input.idempotencyKey,
      couponId: input.couponId,
      items,
      amounts,
      receiver: input.receiver,
    });
    await this.orderRepository.save(order);
    await this.productService.deductStocks(input.items);
    if (input.couponId) {
      await this.couponService.useCoupon({
        couponId: input.couponId,
        userId,
        orderAmount: amounts.itemsAmount,
        orderId: order.id,
      });
    }
    const payment = await this.paymentService.createPayment({
      orderId: order.id,
      method: input.paymentMethod,
      amount: amounts.totalAmount,
      now: new Date(),
    });
    return { order, payment };
  }

  @Transactional()
  private async confirmPayment(
    orderId: string,
    userId: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findByIdAndUserIdForUpdate(
      orderId,
      userId,
    );
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    order.pay();
    await this.orderRepository.save(order);
    await this.paymentService.payByPaymoney(orderId, userId);
    return order;
  }

  @Transactional()
  private async compensateFailure(
    orderId: string,
    userId: string,
  ): Promise<void> {
    const order = await this.orderRepository.findByIdAndUserIdForUpdate(
      orderId,
      userId,
    );
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    order.fail();
    await this.orderRepository.save(order);
    await this.restoreStockAndCoupon(order);
    await this.paymentService.failPayment(orderId);
  }

  private async restoreStockAndCoupon(order: Order): Promise<void> {
    await this.productService.restoreStocks(
      order.items.map((item) => ({
        skuId: item.skuId,
        quantity: item.quantity,
      })),
    );
    if (order.couponId) {
      await this.couponService.cancelCouponUse(
        order.couponId,
        order.userId,
        order.id,
      );
    }
  }

  private async createOrderItemSnapshots(
    items: CreateOrderInput['items'],
  ): Promise<OrderItem[]> {
    const skus = await this.productService.findSkusWithProduct(
      items.map((item) => item.skuId),
    );
    const skuById = new Map(skus.map((sku) => [sku.id, sku]));
    return items.map((item) => {
      const sku = skuById.get(item.skuId);
      if (!sku) {
        throw new SkuNotFoundError(item.skuId);
      }
      return OrderItem.create({
        skuId: sku.id,
        productName: sku.product.name,
        optionName: sku.optionName,
        price: sku.price,
        quantity: item.quantity,
      });
    });
  }
}
