import { ConflictDomainError } from '../../../common/errors/conflict.domain-error';
import { NotFoundDomainError } from '../../../common/errors/not-found.domain-error';
import { ValidationDomainError } from '../../../common/errors/validation.domain-error';

export class UserNotFoundError extends NotFoundDomainError {
  readonly code = 'USER_NOT_FOUND';

  constructor(userId: string) {
    super(`사용자를 찾을 수 없습니다. (userId: ${userId})`);
  }
}

export class DuplicateEmailError extends ConflictDomainError {
  readonly code = 'DUPLICATE_EMAIL';

  constructor(email: string) {
    super(`이미 사용 중인 이메일입니다. (email: ${email})`);
  }
}

export class InsufficientPayMoneyError extends ConflictDomainError {
  readonly code = 'INSUFFICIENT_PAY_MONEY';

  constructor(userId: string) {
    super(`페이머니 잔액이 부족합니다. (userId: ${userId})`);
  }
}

export class InvalidPayMoneyAmountError extends ValidationDomainError {
  readonly code = 'INVALID_PAY_MONEY_AMOUNT';

  constructor(amount: number) {
    super(`페이머니 금액은 양의 정수여야 합니다. (amount: ${amount})`);
  }
}
