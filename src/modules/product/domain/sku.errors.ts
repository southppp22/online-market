import { ConflictDomainError } from '../../../common/errors/conflict.domain-error';
import { NotFoundDomainError } from '../../../common/errors/not-found.domain-error';

export class InsufficientStockError extends ConflictDomainError {
  readonly code = 'INSUFFICIENT_STOCK';

  constructor(skuId: string) {
    super(`재고가 부족합니다. (skuId: ${skuId})`);
  }
}

export class SkuNotFoundError extends NotFoundDomainError {
  readonly code = 'SKU_NOT_FOUND';

  constructor(skuId: string) {
    super(`SKU를 찾을 수 없습니다. (skuId: ${skuId})`);
  }
}
