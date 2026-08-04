import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../../payment/domain/payment.entity';
import type { CreateOrderInput } from '../../application/order.service';

export class CreateOrderItemDto {
  @IsUUID('7')
  skuId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderReceiverDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class CreateOrderPaymentDto {
  @IsIn(Object.values(PaymentMethod))
  method: PaymentMethod;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsUUID('7')
  couponId?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateOrderReceiverDto)
  receiver: CreateOrderReceiverDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateOrderPaymentDto)
  payment: CreateOrderPaymentDto;

  toInput(): CreateOrderInput {
    return {
      idempotencyKey: this.idempotencyKey,
      items: this.items.map((item) => ({
        skuId: item.skuId,
        quantity: item.quantity,
      })),
      couponId: this.couponId ?? null,
      receiver: {
        name: this.receiver.name,
        address: this.receiver.address,
        phone: this.receiver.phone,
        message: this.receiver.message ?? null,
      },
      paymentMethod: this.payment.method,
    };
  }
}
