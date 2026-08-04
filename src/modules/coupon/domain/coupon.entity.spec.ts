import { createTestCoupon } from '../../../../test/fixtures/coupon.fixture';
import { Coupon } from './coupon.entity';
import {
  CouponAlreadyUsedError,
  CouponExpiredError,
  CouponMinOrderAmountError,
  CouponUseMismatchError,
  InvalidCouponAmountError,
} from './coupon.errors';

function createCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return createTestCoupon(overrides);
}

describe('Coupon', () => {
  const before = new Date('2026-08-01T00:00:00Z');
  const after = new Date('2026-09-01T00:00:00Z');

  describe('create', () => {
    const validParams = {
      userId: '019fb1da-b166-7358-a4f4-1d61ba0be631',
      name: '3,000원 할인',
      discountAmount: 3000,
      minOrderAmount: 30000,
      expiresAt: new Date('2026-08-31T14:59:59Z'),
    };

    it('유효한 값이면 미사용 상태로 필드가 모두 설정되고 id가 할당된다', () => {
      const coupon = Coupon.create(validParams);

      expect(coupon.id).toEqual(expect.any(String));
      expect(coupon.userId).toBe(validParams.userId);
      expect(coupon.name).toBe(validParams.name);
      expect(coupon.discountAmount).toBe(3000);
      expect(coupon.minOrderAmount).toBe(30000);
      expect(coupon.expiresAt).toBe(validParams.expiresAt);
      expect(coupon.usedAt).toBeNull();
      expect(coupon.usedOrderId).toBeNull();
    });

    it('할인 금액이 0이면 InvalidCouponAmountError를 던진다', () => {
      expect(() =>
        Coupon.create({ ...validParams, discountAmount: 0 }),
      ).toThrow(InvalidCouponAmountError);
    });

    it('할인 금액이 음수면 InvalidCouponAmountError를 던진다', () => {
      expect(() =>
        Coupon.create({ ...validParams, discountAmount: -1000 }),
      ).toThrow(InvalidCouponAmountError);
    });

    it('할인 금액이 소수면 InvalidCouponAmountError를 던진다', () => {
      expect(() =>
        Coupon.create({ ...validParams, discountAmount: 1.5 }),
      ).toThrow(InvalidCouponAmountError);
    });

    it('최소 주문 금액이 음수면 InvalidCouponAmountError를 던진다', () => {
      expect(() =>
        Coupon.create({ ...validParams, minOrderAmount: -1 }),
      ).toThrow(InvalidCouponAmountError);
    });

    it('최소 주문 금액 0은 허용한다', () => {
      const coupon = Coupon.create({ ...validParams, minOrderAmount: 0 });

      expect(coupon.minOrderAmount).toBe(0);
    });

    it('과거 만료일로도 생성할 수 있다', () => {
      const expiredAt = new Date('2020-01-01T00:00:00Z');

      const coupon = Coupon.create({ ...validParams, expiresAt: expiredAt });

      expect(coupon.expiresAt).toBe(expiredAt);
    });
  });

  describe('isUsable', () => {
    it('미사용이고 만료 전이면 true를 반환한다', () => {
      const coupon = createCoupon();

      expect(coupon.isUsable(before)).toBe(true);
    });

    it('만료되었으면 false를 반환한다', () => {
      const coupon = createCoupon();

      expect(coupon.isUsable(after)).toBe(false);
    });

    it('이미 사용되었으면 false를 반환한다', () => {
      const coupon = createCoupon({
        usedAt: before,
        usedOrderId: '019fb1da-b166-7358-a4f4-1d61ba0be632',
      });

      expect(coupon.isUsable(before)).toBe(false);
    });
  });

  describe('isUsed', () => {
    it('usedAt이 없으면 false를 반환한다', () => {
      expect(createCoupon().isUsed()).toBe(false);
    });

    it('usedAt이 있으면 true를 반환한다', () => {
      const coupon = createCoupon({
        usedAt: before,
        usedOrderId: '019fb1da-b166-7358-a4f4-1d61ba0be632',
      });

      expect(coupon.isUsed()).toBe(true);
    });
  });

  describe('use', () => {
    const orderId = '019fb1da-b166-7358-a4f4-1d61ba0be632';

    it('사용 가능하고 최소 주문 금액을 충족하면 사용 처리한다', () => {
      const coupon = createCoupon();

      coupon.use(30000, orderId, before);

      expect(coupon.usedAt).toBe(before);
      expect(coupon.usedOrderId).toBe(orderId);
    });

    it('이미 사용된 쿠폰이면 CouponAlreadyUsedError를 던진다', () => {
      const coupon = createCoupon({
        usedAt: before,
        usedOrderId: '019fb1da-b166-7358-a4f4-1d61ba0be633',
      });

      expect(() => coupon.use(30000, orderId, before)).toThrow(
        CouponAlreadyUsedError,
      );
    });

    it('만료된 쿠폰이면 CouponExpiredError를 던진다', () => {
      const coupon = createCoupon();

      expect(() => coupon.use(30000, orderId, after)).toThrow(
        CouponExpiredError,
      );
    });

    it('최소 주문 금액 미달이면 CouponMinOrderAmountError를 던진다', () => {
      const coupon = createCoupon();

      expect(() => coupon.use(29999, orderId, before)).toThrow(
        CouponMinOrderAmountError,
      );
    });
  });

  describe('cancelUse', () => {
    const orderId = '019fb1da-b166-7358-a4f4-1d61ba0be632';

    it('해당 주문에서 사용된 쿠폰이면 사용 정보를 초기화한다', () => {
      const coupon = createCoupon({ usedAt: before, usedOrderId: orderId });

      coupon.cancelUse(orderId);

      expect(coupon.usedAt).toBeNull();
      expect(coupon.usedOrderId).toBeNull();
    });

    it('다른 주문에서 사용된 쿠폰이면 CouponUseMismatchError를 던진다', () => {
      const coupon = createCoupon({ usedAt: before, usedOrderId: orderId });

      expect(() =>
        coupon.cancelUse('019fb1da-b166-7358-a4f4-1d61ba0be999'),
      ).toThrow(CouponUseMismatchError);
    });

    it('사용된 적 없는 쿠폰이면 CouponUseMismatchError를 던진다', () => {
      const coupon = createCoupon();

      expect(() => coupon.cancelUse(orderId)).toThrow(CouponUseMismatchError);
    });
  });
});
