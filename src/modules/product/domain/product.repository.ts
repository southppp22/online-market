import { ProductCategory } from './product-category';
import { Product } from './product.entity';
import { Sku } from './sku.entity';

export type ProductSort = 'latest' | 'priceAsc' | 'priceDesc';

export interface ProductListFilter {
  keyword?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  isSoldOut?: boolean;
  sort: ProductSort;
  page: number;
  size: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  basePrice: number;
  category: ProductCategory;
  isSoldOut: boolean;
}

export abstract class ProductRepository {
  abstract findMany(filter: ProductListFilter): Promise<ProductListItem[]>;
  abstract findRecommended(size: number): Promise<ProductListItem[]>;
  abstract findByIdWithSkus(id: string): Promise<Product | null>;
  abstract findSkusByIdsForUpdate(skuIds: string[]): Promise<Sku[]>;
  abstract findSkusWithProductByIds(skuIds: string[]): Promise<Sku[]>;
  abstract saveSkus(skus: Sku[]): Promise<void>;
}
