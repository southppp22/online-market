import {
  Column,
  CreateDateColumn,
  Index,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import {
  CouponAlreadyUsedError,
  CouponExpiredError,
  CouponMinOrderAmountError,
  CouponUseMismatchError,
  InvalidCouponAmountError,
} from './coupon.errors';

@Entity('coupons')
export class Coupon {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column()
  name: string;

  @Column()
  discountAmount: number;

  @Column()
  minOrderAmount: number;

  @Column({ type: 'datetime', precision: 6 })
  expiresAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true })
  usedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  usedOrderId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  static create(params: {
    userId: string;
    name: string;
    discountAmount: number;
    minOrderAmount: number;
    expiresAt: Date;
  }): Coupon {
    if (
      !Number.isInteger(params.discountAmount) ||
      params.discountAmount <= 0
    ) {
      throw new InvalidCouponAmountError(
        'discountAmount',
        params.discountAmount,
      );
    }
    if (!Number.isInteger(params.minOrderAmount) || params.minOrderAmount < 0) {
      throw new InvalidCouponAmountError(
        'minOrderAmount',
        params.minOrderAmount,
      );
    }
    const coupon = new Coupon();
    coupon.id = uuidv7();
    coupon.userId = params.userId;
    coupon.name = params.name;
    coupon.discountAmount = params.discountAmount;
    coupon.minOrderAmount = params.minOrderAmount;
    coupon.expiresAt = params.expiresAt;
    coupon.usedAt = null;
    coupon.usedOrderId = null;
    return coupon;
  }

  isUsable(now: Date): boolean {
    return this.usedAt === null && now < this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }

  use(orderAmount: number, orderId: string, now: Date): void {
    if (this.usedAt !== null) {
      throw new CouponAlreadyUsedError(this.id);
    }
    if (now >= this.expiresAt) {
      throw new CouponExpiredError(this.id);
    }
    if (orderAmount < this.minOrderAmount) {
      throw new CouponMinOrderAmountError(this.id, this.minOrderAmount);
    }
    this.usedAt = now;
    this.usedOrderId = orderId;
  }

  cancelUse(orderId: string): void {
    if (this.usedOrderId !== orderId) {
      throw new CouponUseMismatchError(this.id);
    }
    this.usedAt = null;
    this.usedOrderId = null;
  }
}
