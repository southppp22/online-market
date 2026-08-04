import { ConflictDomainError } from '../../../common/errors/conflict.domain-error';
import { NotFoundDomainError } from '../../../common/errors/not-found.domain-error';
import { ValidationDomainError } from '../../../common/errors/validation.domain-error';

export class InvalidCartQuantityError extends ValidationDomainError {
  readonly code = 'INVALID_CART_QUANTITY';

  constructor(quantity: number) {
    super(`수량은 1 이상 99 이하의 정수여야 합니다. (quantity: ${quantity})`);
  }
}

export class CartQuantityExceededError extends ConflictDomainError {
  readonly code = 'CART_QUANTITY_EXCEEDED';

  constructor(skuId: string) {
    super(`장바구니 수량은 99개를 초과할 수 없습니다. (skuId: ${skuId})`);
  }
}

export class DuplicateCartItemError extends ConflictDomainError {
  readonly code = 'DUPLICATE_CART_ITEM';

  constructor(skuId: string) {
    super(`이미 장바구니에 담긴 SKU입니다. (skuId: ${skuId})`);
  }
}

export class CartItemNotFoundError extends NotFoundDomainError {
  readonly code = 'CART_ITEM_NOT_FOUND';

  constructor(cartItemId: string) {
    super(`장바구니 항목을 찾을 수 없습니다. (cartItemId: ${cartItemId})`);
  }
}
