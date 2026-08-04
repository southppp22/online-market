import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { OrderStatus } from '../../domain/order.entity';
import type { OrderListFilter } from '../../domain/order.repository';

export class OrderListQueryDto {
  @IsOptional()
  @IsIn(Object.values(OrderStatus))
  status?: OrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 20;

  toFilter(): OrderListFilter {
    return {
      status: this.status,
      page: this.page,
      size: this.size,
    };
  }
}
