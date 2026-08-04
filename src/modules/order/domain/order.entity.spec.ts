import {
  createTestOrder,
  createTestOrderItem,
} from '../../../../test/fixtures/order.fixture';
import { OrderAmounts } from './order-amounts';
import { Order, OrderStatus } from './order.entity';
import {
  EmptyOrderItemsError,
  OrderCannotBeCancelledError,
  OrderStatusTransitionError,
} from './order.errors';

const ALL_STATUSES = Object.values(OrderStatus);

function statusesExcept(...allowed: OrderStatus[]): OrderStatus[] {
  return ALL_STATUSES.filter((status) => !allowed.includes(status));
}

describe('Order', () => {
  describe('create', () => {
    const validParams = {
      userId: '019fb1da-b166-7358-a4f4-1d61ba0be630',
      idempotencyKey: 'idem-key-1',
      couponId: null,
      items: [createTestOrderItem()],
      amounts: OrderAmounts.create({ lineAmounts: [10000], couponDiscount: 0 }),
      receiver: {
        name: '김수령',
        address: '서울시 강남구 테헤란로 1',
        phone: '010-1234-5678',
        message: null,
      },
    };

    it('PENDING 상태로 생성되고 금액·수령인 필드가 모두 설정된다', () => {
      const order = Order.create(validParams);

      expect(order.id).toEqual(expect.any(String));
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.userId).toBe(validParams.userId);
      expect(order.idempotencyKey).toBe('idem-key-1');
      expect(order.couponId).toBeNull();
      expect(order.itemsAmount).toBe(10000);
      expect(order.discountAmount).toBe(0);
      expect(order.shippingFee).toBe(3000);
      expect(order.totalAmount).toBe(13000);
      expect(order.receiverName).toBe('김수령');
      expect(order.receiverAddress).toBe('서울시 강남구 테헤란로 1');
      expect(order.receiverPhone).toBe('010-1234-5678');
      expect(order.receiverMessage).toBeNull();
      expect(order.items).toEqual(validParams.items);
    });

    it('items가 비어 있으면 EmptyOrderItemsError를 던진다', () => {
      expect(() => Order.create({ ...validParams, items: [] })).toThrow(
        EmptyOrderItemsError,
      );
    });
  });

  describe('pay', () => {
    it('PENDING이면 PAID로 전이한다', () => {
      const order = createTestOrder({ status: OrderStatus.PENDING });

      order.pay();

      expect(order.status).toBe(OrderStatus.PAID);
    });

    it.each(statusesExcept(OrderStatus.PENDING))(
      '%s 상태면 OrderStatusTransitionError를 던진다',
      (status) => {
        const order = createTestOrder({ status });

        expect(() => order.pay()).toThrow(OrderStatusTransitionError);
      },
    );

    it('전이 거부 메시지에 시도한 전이명 pay가 포함된다', () => {
      const order = createTestOrder({ status: OrderStatus.CANCELLED });

      expect(() => order.pay()).toThrow(/action: pay/);
    });
  });

  describe('fail', () => {
    it('PENDING이면 FAILED로 전이한다', () => {
      const order = createTestOrder({ status: OrderStatus.PENDING });

      order.fail();

      expect(order.status).toBe(OrderStatus.FAILED);
    });

    it.each(statusesExcept(OrderStatus.PENDING))(
      '%s 상태면 OrderStatusTransitionError를 던진다',
      (status) => {
        const order = createTestOrder({ status });

        expect(() => order.fail()).toThrow(OrderStatusTransitionError);
      },
    );
  });

  describe('cancel', () => {
    it.each([OrderStatus.PENDING, OrderStatus.PAID])(
      '%s 상태면 CANCELLED로 전이한다',
      (status) => {
        const order = createTestOrder({ status });

        order.cancel();

        expect(order.status).toBe(OrderStatus.CANCELLED);
      },
    );

    it.each(statusesExcept(OrderStatus.PENDING, OrderStatus.PAID))(
      '%s 상태면 OrderCannotBeCancelledError를 던진다',
      (status) => {
        const order = createTestOrder({ status });

        expect(() => order.cancel()).toThrow(OrderCannotBeCancelledError);
      },
    );
  });

  describe('startShipping', () => {
    it('PAID면 SHIPPING으로 전이한다', () => {
      const order = createTestOrder({ status: OrderStatus.PAID });

      order.startShipping();

      expect(order.status).toBe(OrderStatus.SHIPPING);
    });

    it.each(statusesExcept(OrderStatus.PAID))(
      '%s 상태면 OrderStatusTransitionError를 던진다',
      (status) => {
        const order = createTestOrder({ status });

        expect(() => order.startShipping()).toThrow(OrderStatusTransitionError);
      },
    );
  });

  describe('completeDelivery', () => {
    it('SHIPPING이면 DELIVERED로 전이한다', () => {
      const order = createTestOrder({ status: OrderStatus.SHIPPING });

      order.completeDelivery();

      expect(order.status).toBe(OrderStatus.DELIVERED);
    });

    it.each(statusesExcept(OrderStatus.SHIPPING))(
      '%s 상태면 OrderStatusTransitionError를 던진다',
      (status) => {
        const order = createTestOrder({ status });

        expect(() => order.completeDelivery()).toThrow(
          OrderStatusTransitionError,
        );
      },
    );
  });

  describe('expire / isExpired', () => {
    const createdAt = new Date('2026-08-04T00:00:00Z');

    function minutesAfter(minutes: number): Date {
      return new Date(createdAt.getTime() + minutes * 60 * 1000);
    }

    it('PENDING이고 30분이 경과했으면 FAILED로 전이한다', () => {
      const order = createTestOrder({ createdAt });

      order.expire(minutesAfter(30));

      expect(order.status).toBe(OrderStatus.FAILED);
    });

    it('PENDING이지만 30분 미경과면 OrderStatusTransitionError를 던진다', () => {
      const order = createTestOrder({ createdAt });

      expect(() => order.expire(minutesAfter(29))).toThrow(
        OrderStatusTransitionError,
      );
    });

    it('전이 거부 메시지에 시도한 전이명 expire가 포함된다', () => {
      const order = createTestOrder({ createdAt });

      expect(() => order.expire(minutesAfter(29))).toThrow(/action: expire/);
    });

    it.each(statusesExcept(OrderStatus.PENDING))(
      '30분이 경과해도 %s 상태면 expire가 OrderStatusTransitionError를 던진다',
      (status) => {
        const order = createTestOrder({ status, createdAt });

        expect(() => order.expire(minutesAfter(31))).toThrow(
          OrderStatusTransitionError,
        );
      },
    );

    it('29분 경과 시점에는 만료가 아니다', () => {
      const order = createTestOrder({ createdAt });

      expect(order.isExpired(minutesAfter(29))).toBe(false);
    });

    it('정확히 30분 경과 시점부터 만료다', () => {
      const order = createTestOrder({ createdAt });

      expect(order.isExpired(minutesAfter(30))).toBe(true);
    });

    it('31분 경과 시점에도 만료다', () => {
      const order = createTestOrder({ createdAt });

      expect(order.isExpired(minutesAfter(31))).toBe(true);
    });

    it.each(statusesExcept(OrderStatus.PENDING))(
      '30분이 경과해도 %s 상태면 만료가 아니다',
      (status) => {
        const order = createTestOrder({ status, createdAt });

        expect(order.isExpired(minutesAfter(31))).toBe(false);
      },
    );
  });
});
