import { Coupon } from './coupon.entity';

export interface CouponListOptions {
  usable?: boolean;
}

export abstract class CouponRepository {
  abstract findByUser(
    userId: string,
    options: CouponListOptions,
    now: Date,
  ): Promise<Coupon[]>;
  abstract findByIdAndUserId(
    couponId: string,
    userId: string,
  ): Promise<Coupon | null>;
  abstract findByIdAndUserIdForUpdate(
    couponId: string,
    userId: string,
  ): Promise<Coupon | null>;
  abstract save(coupon: Coupon): Promise<void>;
}
