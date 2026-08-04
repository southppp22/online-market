import { createTestPayment } from '../../../../test/fixtures/payment.fixture';
import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';
import { PaymentStatusTransitionError } from './payment.errors';

const ALL_STATUSES = Object.values(PaymentStatus);

function statusesExcept(...allowed: PaymentStatus[]): PaymentStatus[] {
  return ALL_STATUSES.filter((status) => !allowed.includes(status));
}

describe('Payment', () => {
  describe('create', () => {
    it('REQUESTED 상태로 생성되고 expiresAt은 now + 30분이다', () => {
      const now = new Date('2026-08-04T00:00:00Z');

      const payment = Payment.create({
        orderId: '019fb1da-b166-7358-a4f4-1d61ba0be640',
        method: PaymentMethod.CARD,
        amount: 13000,
        now,
      });

      expect(payment.id).toEqual(expect.any(String));
      expect(payment.orderId).toBe('019fb1da-b166-7358-a4f4-1d61ba0be640');
      expect(payment.method).toBe(PaymentMethod.CARD);
      expect(payment.amount).toBe(13000);
      expect(payment.status).toBe(PaymentStatus.REQUESTED);
      expect(payment.expiresAt).toEqual(new Date('2026-08-04T00:30:00Z'));
    });
  });

  describe('approve', () => {
    it('REQUESTED면 APPROVED로 전이한다', () => {
      const payment = createTestPayment({ status: PaymentStatus.REQUESTED });

      payment.approve();

      expect(payment.status).toBe(PaymentStatus.APPROVED);
    });

    it.each(statusesExcept(PaymentStatus.REQUESTED))(
      '%s 상태면 PaymentStatusTransitionError를 던진다',
      (status) => {
        const payment = createTestPayment({ status });

        expect(() => payment.approve()).toThrow(PaymentStatusTransitionError);
      },
    );
  });

  describe('fail', () => {
    it('REQUESTED면 FAILED로 전이한다', () => {
      const payment = createTestPayment({ status: PaymentStatus.REQUESTED });

      payment.fail();

      expect(payment.status).toBe(PaymentStatus.FAILED);
    });

    it.each(statusesExcept(PaymentStatus.REQUESTED))(
      '%s 상태면 PaymentStatusTransitionError를 던진다',
      (status) => {
        const payment = createTestPayment({ status });

        expect(() => payment.fail()).toThrow(PaymentStatusTransitionError);
      },
    );
  });

  describe('cancel', () => {
    it.each([PaymentStatus.REQUESTED, PaymentStatus.APPROVED])(
      '%s 상태면 CANCELLED로 전이한다',
      (status) => {
        const payment = createTestPayment({ status });

        payment.cancel();

        expect(payment.status).toBe(PaymentStatus.CANCELLED);
      },
    );

    it.each(statusesExcept(PaymentStatus.REQUESTED, PaymentStatus.APPROVED))(
      '%s 상태면 PaymentStatusTransitionError를 던진다',
      (status) => {
        const payment = createTestPayment({ status });

        expect(() => payment.cancel()).toThrow(PaymentStatusTransitionError);
      },
    );
  });
});
