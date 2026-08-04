import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../../src/modules/payment/domain/payment.entity';

export function createTestPayment(overrides: Partial<Payment> = {}): Payment {
  const payment = new Payment();
  payment.id = overrides.id ?? '019fb1da-b166-7358-a4f4-1d61ba0be650';
  payment.orderId = overrides.orderId ?? '019fb1da-b166-7358-a4f4-1d61ba0be640';
  payment.method = overrides.method ?? PaymentMethod.PAY_MONEY;
  payment.amount = overrides.amount ?? 13000;
  payment.status = overrides.status ?? PaymentStatus.REQUESTED;
  payment.expiresAt = overrides.expiresAt ?? new Date('2026-08-04T00:30:00Z');
  return payment;
}
