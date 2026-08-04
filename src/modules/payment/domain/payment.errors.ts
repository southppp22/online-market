import { ConflictDomainError } from '../../../common/errors/conflict.domain-error';
import { NotFoundDomainError } from '../../../common/errors/not-found.domain-error';

export class PaymentNotFoundError extends NotFoundDomainError {
  readonly code = 'PAYMENT_NOT_FOUND';

  constructor(orderId: string) {
    super(`결제를 찾을 수 없습니다. (orderId: ${orderId})`);
  }
}

export class PaymentStatusTransitionError extends ConflictDomainError {
  readonly code = 'PAYMENT_STATUS_TRANSITION_NOT_ALLOWED';

  constructor(paymentId: string, status: string) {
    super(
      `결제 상태를 전이할 수 없습니다. (paymentId: ${paymentId}, status: ${status})`,
    );
  }
}
