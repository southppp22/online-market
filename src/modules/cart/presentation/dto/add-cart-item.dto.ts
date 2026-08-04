import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID('7')
  skuId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}
