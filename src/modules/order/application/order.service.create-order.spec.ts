import { createTestCoupon } from '../../../../test/fixtures/coupon.fixture';
import { createTestOrder } from '../../../../test/fixtures/order.fixture';
import { createTestPayment } from '../../../../test/fixtures/payment.fixture';
import { createTestSku } from '../../../../test/fixtures/product.fixture';
import {
  createOrderServiceTestContext,
  OrderServiceTestContext,
} from '../../../../test/helpers/order-service-test-module';
import { CreatePaymentInput } from '../../payment/application/payment.service';
import { PaymentMethod } from '../../payment/domain/payment.entity';
import { InsufficientPayMoneyError } from '../../user/domain/user.errors';
import { Order, OrderStatus } from '../domain/order.entity';
import {
  DuplicateIdempotencyKeyError,
  OrderStatusTransitionError,
} from '../domain/order.errors';
import { CreateOrderInput } from './order.service';

const userId = '019fb1da-b166-7358-a4f4-1d61ba0be630';
const skuId = '019fb1da-b166-7358-a4f4-1d61ba0be631';
const couponId = '019fb1da-b166-7358-a4f4-1d61ba0be632';
const orderId = '019fb1da-b166-7358-a4f4-1d61ba0be640';

function createInput(
  overrides: Partial<CreateOrderInput> = {},
): CreateOrderInput {
  return {
    idempotencyKey: 'idem-key-1',
    items: [{ skuId, quantity: 1 }],
    couponId: null,
    receiver: {
      name: '김수령',
      address: '서울시 강남구 테헤란로 1',
      phone: '010-1234-5678',
      message: null,
    },
    paymentMethod: PaymentMethod.PAY_MONEY,
    ...overrides,
  };
}

describe('OrderService.createOrder', () => {
  let ctx: OrderServiceTestContext;

  beforeEach(async () => {
    ctx = await createOrderServiceTestContext();

    ctx.orderRepository.findByIdempotencyKey.mockResolvedValue(null);
    ctx.productService.findSkusWithProduct.mockResolvedValue([
      createTestSku({ id: skuId, price: 40000 }),
    ]);
    ctx.paymentService.createPayment.mockImplementation(
      (input: CreatePaymentInput) =>
        Promise.resolve(
          createTestPayment({
            orderId: input.orderId,
            method: input.method,
            amount: input.amount,
          }),
        ),
    );
    ctx.orderRepository.findByIdAndUserIdForUpdate.mockImplementation(() =>
      Promise.resolve(createTestOrder({ id: orderId, couponId: null })),
    );
    ctx.couponService.getCoupon.mockResolvedValue(
      createTestCoupon({
        id: couponId,
        userId,
        discountAmount: 3000,
        minOrderAmount: 30000,
      }),
    );
  });

  function savedOrder(): Order {
    return ctx.orderRepository.save.mock.calls[0][0];
  }

  describe('PAY_MONEY', () => {
    it('T1(주문 생성)과 T2(결제 승인)를 별개 트랜잭션으로 실행해 PAID 주문을 반환한다', async () => {
      const result = await ctx.service.createOrder(userId, createInput());

      expect(ctx.withTransaction).toHaveBeenCalledTimes(2);
      const [t1At, t2At] = ctx.withTransaction.mock.invocationCallOrder;
      const [insertAt] = ctx.orderRepository.save.mock.invocationCallOrder;
      const [approveAt] =
        ctx.paymentService.payByPaymoney.mock.invocationCallOrder;
      expect(insertAt).toBeGreaterThan(t1At);
      expect(insertAt).toBeLessThan(t2At);
      expect(approveAt).toBeGreaterThan(t2At);
      expect(ctx.paymentService.payByPaymoney).toHaveBeenCalledWith(
        savedOrder().id,
        userId,
      );
      expect(result.order.status).toBe(OrderStatus.PAID);
    });

    it('잔액 부족이면 T3로 보상(FAILED 저장 + 재고·쿠폰 복원)한 뒤 에러를 다시 던진다', async () => {
      ctx.orderRepository.findByIdAndUserIdForUpdate.mockImplementation(() =>
        Promise.resolve(createTestOrder({ id: orderId, couponId })),
      );
      ctx.paymentService.payByPaymoney.mockRejectedValue(
        new InsufficientPayMoneyError(userId),
      );

      await expect(
        ctx.service.createOrder(userId, createInput({ couponId })),
      ).rejects.toThrow(InsufficientPayMoneyError);

      expect(ctx.withTransaction).toHaveBeenCalledTimes(3);
      expect(ctx.productService.restoreStocks).toHaveBeenCalledWith([
        { skuId, quantity: 1 },
      ]);
      expect(ctx.couponService.cancelCouponUse).toHaveBeenCalledWith(
        couponId,
        userId,
        orderId,
      );
      expect(ctx.paymentService.failPayment).toHaveBeenCalledWith(
        savedOrder().id,
      );
      const lastSaved = ctx.orderRepository.save.mock.calls.at(-1)?.[0];
      expect(lastSaved?.status).toBe(OrderStatus.FAILED);
    });
  });

  describe('CARD', () => {
    it('T2 없이 PENDING인 채 반환한다', async () => {
      const result = await ctx.service.createOrder(
        userId,
        createInput({ paymentMethod: PaymentMethod.CARD }),
      );

      expect(ctx.withTransaction).toHaveBeenCalledTimes(1);
      expect(
        ctx.orderRepository.findByIdAndUserIdForUpdate,
      ).not.toHaveBeenCalled();
      expect(ctx.paymentService.payByPaymoney).not.toHaveBeenCalled();
      expect(result.order).toBe(savedOrder());
      expect(result.order.status).toBe(OrderStatus.PENDING);
    });
  });

  describe('멱등성', () => {
    it('같은 키의 주문이 있으면 재고·결제 없이 그대로 반환한다', async () => {
      const existing = createTestOrder({ id: orderId, userId });
      const payment = createTestPayment({ orderId });
      ctx.orderRepository.findByIdempotencyKey.mockResolvedValue(existing);
      ctx.paymentService.getPaymentByOrderId.mockResolvedValue(payment);

      const result = await ctx.service.createOrder(userId, createInput());

      expect(result).toEqual({ order: existing, payment });
      expect(ctx.withTransaction).not.toHaveBeenCalled();
      expect(ctx.orderRepository.save).not.toHaveBeenCalled();
      expect(ctx.productService.deductStocks).not.toHaveBeenCalled();
      expect(ctx.paymentService.createPayment).not.toHaveBeenCalled();
      expect(ctx.paymentService.payByPaymoney).not.toHaveBeenCalled();
    });

    it('FAILED 주문의 키도 그대로 반환한다', async () => {
      const existing = createTestOrder({
        id: orderId,
        userId,
        status: OrderStatus.FAILED,
      });
      ctx.orderRepository.findByIdempotencyKey.mockResolvedValue(existing);
      ctx.paymentService.getPaymentByOrderId.mockResolvedValue(
        createTestPayment({ orderId }),
      );

      const result = await ctx.service.createOrder(userId, createInput());

      expect(result.order).toBe(existing);
      expect(result.order.status).toBe(OrderStatus.FAILED);
      expect(ctx.withTransaction).not.toHaveBeenCalled();
    });

    it('insert가 unique 위반이면 롤백 후 재조회한 기존 주문을 반환한다', async () => {
      const existing = createTestOrder({ id: orderId, userId });
      ctx.orderRepository.findByIdempotencyKey
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existing);
      ctx.orderRepository.save.mockRejectedValue(
        new DuplicateIdempotencyKeyError('idem-key-1'),
      );
      ctx.paymentService.getPaymentByOrderId.mockResolvedValue(
        createTestPayment({ orderId }),
      );

      const result = await ctx.service.createOrder(
        userId,
        createInput({ couponId }),
      );

      expect(result.order).toBe(existing);
      expect(ctx.orderRepository.findByIdempotencyKey).toHaveBeenCalledTimes(2);
      expect(ctx.productService.deductStocks).not.toHaveBeenCalled();
      expect(ctx.couponService.useCoupon).not.toHaveBeenCalled();
      expect(ctx.paymentService.createPayment).not.toHaveBeenCalled();
    });
  });

  describe('쿠폰', () => {
    it('쿠폰 사용 판정에는 할인 전 itemsAmount를 전달한다', async () => {
      await ctx.service.createOrder(userId, createInput({ couponId }));

      const order = savedOrder();
      expect(order.itemsAmount).toBe(40000);
      expect(order.totalAmount).toBe(37000);
      expect(ctx.couponService.useCoupon).toHaveBeenCalledWith({
        couponId,
        userId,
        orderAmount: 40000,
        orderId: order.id,
      });
      expect(ctx.paymentService.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 37000 }),
      );
    });

    it('쿠폰 없이(couponId null) 주문하면 쿠폰 조회·사용 없이 성공한다', async () => {
      const result = await ctx.service.createOrder(userId, createInput());

      expect(ctx.couponService.getCoupon).not.toHaveBeenCalled();
      expect(ctx.couponService.useCoupon).not.toHaveBeenCalled();
      expect(savedOrder().discountAmount).toBe(0);
      expect(result.order.status).toBe(OrderStatus.PAID);
    });

    it('T1 내부 쓰기 순서는 주문 insert → 재고 차감 → 쿠폰 사용 → 결제 생성이다', async () => {
      await ctx.service.createOrder(userId, createInput({ couponId }));

      const at = (mock: { mock: { invocationCallOrder: number[] } }) =>
        mock.mock.invocationCallOrder[0];
      expect(at(ctx.orderRepository.save)).toBeLessThan(
        at(ctx.productService.deductStocks),
      );
      expect(at(ctx.productService.deductStocks)).toBeLessThan(
        at(ctx.couponService.useCoupon),
      );
      expect(at(ctx.couponService.useCoupon)).toBeLessThan(
        at(ctx.paymentService.createPayment),
      );
    });
  });

  describe('이중 복원 방지', () => {
    it('CANCELLED 주문에 compensateFailure가 실행되면 복원·결제 실패 처리를 모두 스킵한다', async () => {
      ctx.orderRepository.findByIdAndUserIdForUpdate.mockResolvedValue(
        createTestOrder({
          id: orderId,
          status: OrderStatus.CANCELLED,
          couponId,
        }),
      );

      await expect(
        ctx.service['compensateFailure'](orderId, userId),
      ).rejects.toThrow(OrderStatusTransitionError);

      expect(ctx.productService.restoreStocks).not.toHaveBeenCalled();
      expect(ctx.couponService.cancelCouponUse).not.toHaveBeenCalled();
      expect(ctx.paymentService.failPayment).not.toHaveBeenCalled();
      expect(ctx.orderRepository.save).not.toHaveBeenCalled();
    });

    it('CANCELLED 주문에 confirmPayment가 실행되면 잔액 차감(payByPaymoney)을 스킵한다', async () => {
      ctx.orderRepository.findByIdAndUserIdForUpdate.mockResolvedValue(
        createTestOrder({ id: orderId, status: OrderStatus.CANCELLED }),
      );

      await expect(
        ctx.service['confirmPayment'](orderId, userId),
      ).rejects.toThrow(OrderStatusTransitionError);

      expect(ctx.paymentService.payByPaymoney).not.toHaveBeenCalled();
      expect(ctx.orderRepository.save).not.toHaveBeenCalled();
    });
  });
});
