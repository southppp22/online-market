import { ProductCategory } from './product-category';
import { Product } from './product.entity';

describe('Product', () => {
  describe('create', () => {
    it('id가 채워진 미삭제 상태로 생성한다', () => {
      const product = Product.create({
        name: '무선 이어폰',
        description: '설명',
        basePrice: 79000,
        category: ProductCategory.ELECTRONICS,
      });

      expect(product.id).toBeDefined();
      expect(product.isRecommended).toBe(false);
      expect(product.isDeleted()).toBe(false);
    });
  });

  describe('delete', () => {
    it('삭제 시각을 기록해 삭제 상태가 된다', () => {
      const product = Product.create({
        name: '무선 이어폰',
        description: '설명',
        basePrice: 79000,
        category: ProductCategory.ELECTRONICS,
      });

      product.delete(new Date('2026-08-04T00:00:00Z'));

      expect(product.isDeleted()).toBe(true);
      expect(product.deletedAt).toEqual(new Date('2026-08-04T00:00:00Z'));
    });
  });
});
