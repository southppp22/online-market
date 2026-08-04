import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { Coupon } from '../domain/coupon.entity';
import { CouponNotFoundError } from '../domain/coupon.errors';
import { CouponRepository } from '../domain/coupon.repository';

export interface IssueCouponInput {
  userId: string;
  name: string;
  discountAmount: number;
  minOrderAmount: number;
  expiresAt: Date;
}

export interface UseCouponInput {
  couponId: string;
  userId: string;
  orderAmount: number;
  orderId: string;
}

@Injectable()
export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  async getMyCoupons(userId: string): Promise<Coupon[]> {
    return this.couponRepository.findByUser(userId, {}, new Date());
  }

  async getMyUsableCoupons(userId: string): Promise<Coupon[]> {
    return this.couponRepository.findByUser(
      userId,
      { usable: true },
      new Date(),
    );
  }

  async getCoupon(couponId: string, userId: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findByIdAndUserId(
      couponId,
      userId,
    );
    if (!coupon) {
      throw new CouponNotFoundError(couponId);
    }
    return coupon;
  }

  @Transactional()
  async useCoupon(input: UseCouponInput): Promise<void> {
    const coupon = await this.couponRepository.findByIdAndUserIdForUpdate(
      input.couponId,
      input.userId,
    );
    if (!coupon) {
      throw new CouponNotFoundError(input.couponId);
    }
    coupon.use(input.orderAmount, input.orderId, new Date());
    await this.couponRepository.save(coupon);
  }

  @Transactional()
  async cancelCouponUse(
    couponId: string,
    userId: string,
    orderId: string,
  ): Promise<void> {
    const coupon = await this.couponRepository.findByIdAndUserIdForUpdate(
      couponId,
      userId,
    );
    if (!coupon) {
      throw new CouponNotFoundError(couponId);
    }
    coupon.cancelUse(orderId);
    await this.couponRepository.save(coupon);
  }

  async issueCoupon(input: IssueCouponInput): Promise<Coupon> {
    const coupon = Coupon.create(input);
    await this.couponRepository.save(coupon);
    return coupon;
  }
}
