import { Payment } from './payment.entity';

export abstract class PaymentRepository {
  abstract findByOrderId(orderId: string): Promise<Payment | null>;
  abstract save(payment: Payment): Promise<void>;
}
