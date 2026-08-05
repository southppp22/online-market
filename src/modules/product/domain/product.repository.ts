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

// 서비스하는 조회 창의 크기 — totalCount는 여기서 잘리고(초과분은 hasMore), 오프셋도 여기까지만 허용한다.
export const PRODUCT_LIST_MAX_RESULTS = 10_000;

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
