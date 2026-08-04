import { NotFoundDomainError } from '../../../common/errors/not-found.domain-error';

export class ProductNotFoundError extends NotFoundDomainError {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(productId: string) {
    super(`상품을 찾을 수 없습니다. (productId: ${productId})`);
  }
}
