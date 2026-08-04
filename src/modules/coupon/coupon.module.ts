import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponService } from './application/coupon.service';
import { Coupon } from './domain/coupon.entity';
import { CouponRepository } from './domain/coupon.repository';
import { TypeOrmCouponRepository } from './infrastructure/typeorm-coupon.repository';
import { CouponController } from './presentation/coupon.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon])],
  controllers: [CouponController],
  providers: [
    CouponService,
    { provide: CouponRepository, useClass: TypeOrmCouponRepository },
  ],
  exports: [CouponService],
})
export class CouponModule {}
