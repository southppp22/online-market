import { ProductCategory } from './product-category';
import { Product } from './product.entity';
import { Sku } from './sku.entity';

export type ProductSort = 'latest' | 'priceAsc' | 'priceDesc';

export interface ProductListFilter {
  keyword?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  recommended?: boolean;
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

// totalCount는 이 값에서 잘리고, 초과분은 hasMore로만 알린다.
export const PRODUCT_LIST_COUNT_CAP = 10_000;

export interface ProductListResult {
  items: ProductListItem[];
  totalCount: number;
  hasMore: boolean;
}

export abstract class ProductRepository {
  abstract findMany(filter: ProductListFilter): Promise<ProductListResult>;
  abstract findRecommended(size: number): Promise<ProductListItem[]>;
  abstract findByIdWithSkus(id: string): Promise<Product | null>;
  abstract findSkusByIdsForUpdate(skuIds: string[]): Promise<Sku[]>;
  abstract findSkusWithProductByIds(skuIds: string[]): Promise<Sku[]>;
  abstract saveSkus(skus: Sku[]): Promise<void>;
}
