import {
  createTestProduct,
  createTestSku,
} from '../../../../test/fixtures/product.fixture';
import { Sku } from './sku.entity';
import { InsufficientStockError, SkuNotFoundError } from './sku.errors';

function createSku(stock: number, productDeletedAt: Date | null = null): Sku {
  return createTestSku({
    stock,
    product: createTestProduct({ deletedAt: productDeletedAt }),
  });
}

describe('Sku', () => {
  describe('decreaseStock', () => {
    it('재고가 충분하면 수량만큼 차감한다', () => {
      const sku = createSku(10);

      sku.decreaseStock(3);

      expect(sku.stock).toBe(7);
    });

    it('재고보다 많은 수량을 요청하면 도메인 에러를 던진다', () => {
      const sku = createSku(2);

      expect(() => sku.decreaseStock(3)).toThrow(InsufficientStockError);
    });
  });

  describe('increaseStock', () => {
    it('수량만큼 재고를 증가시킨다', () => {
      const sku = createSku(5);

      sku.increaseStock(3);

      expect(sku.stock).toBe(8);
    });
  });

  describe('isSoldOut', () => {
    it('재고가 0이면 true를 반환한다', () => {
      expect(createSku(0).isSoldOut()).toBe(true);
    });

    it('재고가 0보다 크면 false를 반환한다', () => {
      expect(createSku(1).isSoldOut()).toBe(false);
    });
  });

  describe('isUnavailable', () => {
    it('재고가 0이면 true를 반환한다', () => {
      expect(createSku(0).isUnavailable()).toBe(true);
    });

    it('상품이 소프트 삭제되었으면 true를 반환한다', () => {
      expect(createSku(1, new Date()).isUnavailable()).toBe(true);
    });

    it('재고가 있고 상품이 삭제되지 않았으면 false를 반환한다', () => {
      expect(createSku(1).isUnavailable()).toBe(false);
    });
  });

  describe('assertAddableToCart', () => {
    it('품절이어도 상품이 삭제되지 않았으면 통과한다', () => {
      expect(() => createSku(0).assertAddableToCart()).not.toThrow();
    });

    it('상품이 소프트 삭제되었으면 SkuNotFoundError를 던진다', () => {
      expect(() => createSku(1, new Date()).assertAddableToCart()).toThrow(
        SkuNotFoundError,
      );
    });
  });
});
