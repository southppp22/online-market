import { IsIn, IsOptional } from 'class-validator';

export class CouponListQueryDto {
  @IsOptional()
  @IsIn(['true', 'false'])
  usable?: string;

  isUsableOnly(): boolean {
    return this.usable === 'true';
  }
}
