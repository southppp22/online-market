import { Coupon } from '../../src/modules/coupon/domain/coupon.entity';

export function createTestCoupon(overrides: Partial<Coupon> = {}): Coupon {
  const coupon = new Coupon();
  coupon.id = overrides.id ?? '019fb1da-b166-7358-a4f4-1d61ba0be630';
  coupon.userId = overrides.userId ?? '019fb1da-b166-7358-a4f4-1d61ba0be631';
  coupon.name = overrides.name ?? '3,000원 할인';
  coupon.discountAmount = overrides.discountAmount ?? 3000;
  coupon.minOrderAmount = overrides.minOrderAmount ?? 30000;
  coupon.expiresAt = overrides.expiresAt ?? new Date('2026-08-31T14:59:59Z');
  coupon.usedAt = overrides.usedAt ?? null;
  coupon.usedOrderId = overrides.usedOrderId ?? null;
  return coupon;
}
