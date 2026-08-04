import { Order, OrderStatus } from '../../domain/order.entity';

export class CancelOrderResponseDto {
  refundAmount: number;
  order: {
    id: string;
    status: OrderStatus;
  };

  private constructor(order: Order, refundAmount: number) {
    this.refundAmount = refundAmount;
    this.order = {
      id: order.id,
      status: order.status,
    };
  }

  static from(order: Order, refundAmount: number): CancelOrderResponseDto {
    return new CancelOrderResponseDto(order, refundAmount);
  }
}
