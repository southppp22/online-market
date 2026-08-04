import { ProductCategory } from '../../src/modules/product/domain/product-category';
import { Product } from '../../src/modules/product/domain/product.entity';
import { Sku } from '../../src/modules/product/domain/sku.entity';

export function createTestProduct(overrides: Partial<Product> = {}): Product {
  const product = new Product();
  product.id = overrides.id ?? '019fb1da-b166-7358-a4f4-1d61ba0be633';
  product.name = overrides.name ?? '무선 이어폰';
  product.description = overrides.description ?? '설명';
  product.basePrice = overrides.basePrice ?? 10000;
  product.category = overrides.category ?? ProductCategory.ELECTRONICS;
  product.isRecommended = overrides.isRecommended ?? false;
  product.deletedAt = overrides.deletedAt ?? null;
  return product;
}

export function createTestSku(overrides: Partial<Sku> = {}): Sku {
  const sku = new Sku();
  sku.id = overrides.id ?? '019fb1da-b166-7358-a4f4-1d61ba0be631';
  sku.productId = overrides.productId ?? '019fb1da-b166-7358-a4f4-1d61ba0be633';
  sku.optionName = overrides.optionName ?? '블랙';
  sku.price = overrides.price ?? 10000;
  sku.stock = overrides.stock ?? 10;
  sku.product = overrides.product ?? createTestProduct({ id: sku.productId });
  return sku;
}
