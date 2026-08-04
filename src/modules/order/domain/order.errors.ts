import { ConflictDomainError } from '../../../common/errors/conflict.domain-error';
import { NotFoundDomainError } from '../../../common/errors/not-found.domain-error';
import { ValidationDomainError } from '../../../common/errors/validation.domain-error';

export class OrderNotFoundError extends NotFoundDomainError {
  readonly code = 'ORDER_NOT_FOUND';

  constructor(orderId: string) {
    super(`주문을 찾을 수 없습니다. (orderId: ${orderId})`);
  }
}

export class OrderCannotBeCancelledError extends ConflictDomainError {
  readonly code = 'ORDER_CANNOT_BE_CANCELLED';

  constructor(orderId: string, status: string) {
    super(
      `취소할 수 없는 주문입니다. (orderId: ${orderId}, status: ${status})`,
    );
  }
}

export class OrderStatusTransitionError extends ConflictDomainError {
  readonly code = 'ORDER_STATUS_TRANSITION_NOT_ALLOWED';

  constructor(orderId: string, status: string, action: string) {
    super(
      `주문 상태를 전이할 수 없습니다. (orderId: ${orderId}, status: ${status}, action: ${action})`,
    );
  }
}

export class DuplicateIdempotencyKeyError extends ConflictDomainError {
  readonly code = 'DUPLICATE_IDEMPOTENCY_KEY';

  constructor(idempotencyKey: string) {
    super(`이미 접수된 주문 요청입니다. (idempotencyKey: ${idempotencyKey})`);
  }
}

export class EmptyOrderItemsError extends ValidationDomainError {
  readonly code = 'EMPTY_ORDER_ITEMS';

  constructor() {
    super('주문 항목이 비어 있습니다.');
  }
}

export class InvalidOrderAmountError extends ValidationDomainError {
  readonly code = 'INVALID_ORDER_AMOUNT';

  constructor(totalAmount: number) {
    super(`주문 금액이 올바르지 않습니다. (totalAmount: ${totalAmount})`);
  }
}
