import { Payment } from '../../../payment/domain/payment.entity';
import { Order, OrderStatus } from '../../domain/order.entity';

export class CreateOrderResponseDto {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  payment: {
    id: string;
    expiresAt: Date | null;
  };

  private constructor(order: Order, payment: Payment) {
    this.id = order.id;
    this.status = order.status;
    this.totalAmount = order.totalAmount;
    this.payment = {
      id: payment.id,
      expiresAt:
        order.status === OrderStatus.PENDING ? payment.expiresAt : null,
    };
  }

  static from(order: Order, payment: Payment): CreateOrderResponseDto {
    return new CreateOrderResponseDto(order, payment);
  }
}
