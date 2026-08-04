import { Coupon } from '../../domain/coupon.entity';

export class CouponListItemResponseDto {
  id: string;
  name: string;
  discountAmount: number;
  minOrderAmount: number;
  isUsed: boolean;
  expiresAt: string;

  private constructor(coupon: Coupon) {
    this.id = coupon.id;
    this.name = coupon.name;
    this.discountAmount = coupon.discountAmount;
    this.minOrderAmount = coupon.minOrderAmount;
    this.isUsed = coupon.isUsed();
    this.expiresAt = coupon.expiresAt.toISOString();
  }

  static from(coupon: Coupon): CouponListItemResponseDto {
    return new CouponListItemResponseDto(coupon);
  }
}

export class CouponListResponseDto {
  items: CouponListItemResponseDto[];

  private constructor(coupons: Coupon[]) {
    this.items = coupons.map((coupon) =>
      CouponListItemResponseDto.from(coupon),
    );
  }

  static from(coupons: Coupon[]): CouponListResponseDto {
    return new CouponListResponseDto(coupons);
  }
}
