import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { Coupon } from '../domain/coupon.entity';
import {
  CouponListOptions,
  CouponRepository,
} from '../domain/coupon.repository';

@Injectable()
export class TypeOrmCouponRepository extends CouponRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super();
  }

  async findByUser(
    userId: string,
    options: CouponListOptions,
    now: Date,
  ): Promise<Coupon[]> {
    const qb = this.txHost.tx
      .createQueryBuilder(Coupon, 'coupon')
      .where('coupon.userId = :userId', { userId });
    if (options.usable) {
      qb.andWhere('coupon.usedAt IS NULL').andWhere('coupon.expiresAt > :now', {
        now,
      });
    }
    return qb.orderBy('coupon.createdAt', 'DESC').getMany();
  }

  async findByIdAndUserId(
    couponId: string,
    userId: string,
  ): Promise<Coupon | null> {
    return this.txHost.tx.findOneBy(Coupon, {
      id: couponId,
      userId,
    });
  }

  async findByIdAndUserIdForUpdate(
    couponId: string,
    userId: string,
  ): Promise<Coupon | null> {
    return this.txHost.tx
      .createQueryBuilder(Coupon, 'coupon')
      .where('coupon.id = :couponId', { couponId })
      .andWhere('coupon.userId = :userId', { userId })
      .setLock('pessimistic_write')
      .getOne();
  }

  async save(coupon: Coupon): Promise<void> {
    await this.txHost.tx.save(coupon);
  }
}
