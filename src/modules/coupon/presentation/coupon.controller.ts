import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { CouponService } from '../application/coupon.service';
import { CouponListQueryDto } from './dto/coupon-list-query.dto';
import { CouponListResponseDto } from './dto/coupon-list-response.dto';

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  async list(
    @CurrentUser() userId: string,
    @Query() query: CouponListQueryDto,
  ): Promise<CouponListResponseDto> {
    const coupons = query.isUsableOnly()
      ? await this.couponService.getMyUsableCoupons(userId)
      : await this.couponService.getMyCoupons(userId);
    return CouponListResponseDto.from(coupons);
  }
}
