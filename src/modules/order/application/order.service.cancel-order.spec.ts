import {
  createTestOrder,
  createTestOrderItem,
} from '../../../../test/fixtures/order.fixture';
import {
  createOrderServiceTestContext,
  OrderServiceTestContext,
} from '../../../../test/helpers/order-service-test-module';
import { OrderStatus } from '../domain/order.entity';
import {
  OrderCannotBeCancelledError,
  OrderNotFoundError,
} from '../domain/order.errors';

const userId = '019fb1da-b166-7358-a4f4-1d61ba0be630';
const orderId = '019fb1da-b166-7358-a4f4-1d61ba0be640';
const couponId = '019fb1da-b166-7358-a4f4-1d61ba0be660';

describe('OrderService.cancelOrder', () => {
  let ctx: OrderServiceTestContext;

  beforeEach(async () => {
    ctx = await createOrderServiceTestContext();
  });

  it('PAID 주문을 취소하면 재고·쿠폰을 복원하고 환불액을 반환한다', async () => {
    const order = createTestOrder({
      id: orderId,
      userId,
      status: OrderStatus.PAID,
      couponId,
      totalAmount: 13000,
      items: [createTestOrderItem({ orderId, quantity: 2 })],
    });
    ctx.orderRepository.findByIdAndUserIdForUpdate.mockResolvedValue(order);
    ctx.paymentService.cancelPayment.mockResolvedValue(13000);

    const actual = await ctx.service.cancelOrder(orderId, userId);

    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(ctx.orderRepository.save).toHaveBeenCalledWith(order);
    expect(ctx.productService.restoreStocks).toHaveBeenCalledWith([
      { skuId: order.items[0].skuId, quantity: 2 },
    ]);
    expect(ctx.couponService.cancelCouponUse).toHaveBeenCalledWith(
      couponId,
      userId,
      orderId,
    );
    expect(ctx.paymentService.cancelPayment).toHaveBeenCalledWith(
      orderId,
      userId,
    );
    expect(actual).toEqual({ order, refundAmount: 13000 });
    expect(ctx.withTransaction).toHaveBeenCalledTimes(1);
  });

  it('PENDING(CARD) 주문 취소는 refundAmount 0을 반환한다', async () => {
    const order = createTestOrder({
      id: orderId,
      userId,
      status: OrderStatus.PENDING,
    });
    ctx.orderRepository.findByIdAndUserIdForUpdate.mockResolvedValue(order);
    ctx.paymentService.cancelPayment.mockResolvedValue(0);

    const actual = await ctx.service.cancelOrder(orderId, userId);

    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(actual.refundAmount).toBe(0);
  });

  it('쿠폰 없는 주문 취소는 쿠폰 복원을 호출하지 않는다', async () => {
    const order = createTestOrder({
      id: orderId,
      userId,
      status: OrderStatus.PAID,
      couponId: null,
    });
    ctx.orderRepository.findByIdAndUserIdForUpdate.mockResolvedValue(order);
    ctx.paymentService.cancelPayment.mockResolvedValue(13000);

    await ctx.service.cancelOrder(orderId, userId);

    expect(ctx.couponService.cancelCouponUse).not.toHaveBeenCalled();
  });

  it('SHIPPING 주문은 취소할 수 없고 복원·환불도 수행하지 않는다', async () => {
    const order = createTestOrder({
      id: orderId,
      userId,
      status: OrderStatus.SHIPPING,
    });
    ctx.orderRepository.findByIdAndUserIdForUpdate.mockResolvedValue(order);

    await expect(ctx.service.cancelOrder(orderId, userId)).rejects.toThrow(
      OrderCannotBeCancelledError,
    );

    expect(ctx.orderRepository.save).not.toHaveBeenCalled();
    expect(ctx.productService.restoreStocks).not.toHaveBeenCalled();
    expect(ctx.couponService.cancelCouponUse).not.toHaveBeenCalled();
    expect(ctx.paymentService.cancelPayment).not.toHaveBeenCalled();
  });

  it('이미 취소된 주문의 재취소는 OrderCannotBeCancelledError를 던진다', async () => {
    const order = createTestOrder({
      id: orderId,
      userId,
      status: OrderStatus.CANCELLED,
    });
    ctx.orderRepository.findByIdAndUserIdForUpdate.mockResolvedValue(order);

    await expect(ctx.service.cancelOrder(orderId, userId)).rejects.toThrow(
      OrderCannotBeCancelledError,
    );
    expect(ctx.productService.restoreStocks).not.toHaveBeenCalled();
  });

  it('주문이 없으면 OrderNotFoundError를 던진다', async () => {
    ctx.orderRepository.findByIdAndUserIdForUpdate.mockResolvedValue(null);

    await expect(ctx.service.cancelOrder(orderId, userId)).rejects.toThrow(
      OrderNotFoundError,
    );
  });
});
