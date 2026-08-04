import { ConflictDomainError } from '../../../common/errors/conflict.domain-error';
import { NotFoundDomainError } from '../../../common/errors/not-found.domain-error';
import { ValidationDomainError } from '../../../common/errors/validation.domain-error';

export class InvalidCouponAmountError extends ValidationDomainError {
  readonly code = 'INVALID_COUPON_AMOUNT';

  constructor(field: string, value: number) {
    super(`쿠폰 금액이 올바르지 않습니다. (${field}: ${value})`);
  }
}

export class CouponNotFoundError extends NotFoundDomainError {
  readonly code = 'COUPON_NOT_FOUND';

  constructor(couponId: string) {
    super(`쿠폰을 찾을 수 없습니다. (couponId: ${couponId})`);
  }
}

export class CouponAlreadyUsedError extends ConflictDomainError {
  readonly code = 'COUPON_ALREADY_USED';

  constructor(couponId: string) {
    super(`이미 사용된 쿠폰입니다. (couponId: ${couponId})`);
  }
}

export class CouponExpiredError extends ConflictDomainError {
  readonly code = 'COUPON_EXPIRED';

  constructor(couponId: string) {
    super(`만료된 쿠폰입니다. (couponId: ${couponId})`);
  }
}

export class CouponMinOrderAmountError extends ConflictDomainError {
  readonly code = 'COUPON_MIN_ORDER_AMOUNT_NOT_MET';

  constructor(couponId: string, minOrderAmount: number) {
    super(
      `최소 주문 금액을 충족하지 않습니다. (couponId: ${couponId}, minOrderAmount: ${minOrderAmount})`,
    );
  }
}

export class CouponUseMismatchError extends ConflictDomainError {
  readonly code = 'COUPON_USE_MISMATCH';

  constructor(couponId: string) {
    super(`해당 주문에서 사용된 쿠폰이 아닙니다. (couponId: ${couponId})`);
  }
}
