import { ProductCategory } from '../../domain/product-category';
import {
  ProductListFilter,
  ProductListItem,
  ProductListResult,
} from '../../domain/product.repository';

export class ProductListItemResponseDto {
  id: string;
  name: string;
  basePrice: number;
  category: ProductCategory;
  isSoldOut: boolean;

  private constructor(item: ProductListItem) {
    this.id = item.id;
    this.name = item.name;
    this.basePrice = item.basePrice;
    this.category = item.category;
    this.isSoldOut = item.isSoldOut;
  }

  static from(item: ProductListItem): ProductListItemResponseDto {
    return new ProductListItemResponseDto(item);
  }
}

export class ProductListResponseDto {
  items: ProductListItemResponseDto[];
  page: number;
  size: number;
  totalCount: number;
  hasMore: boolean;

  private constructor(
    result: ProductListResult,
    filter: Pick<ProductListFilter, 'page' | 'size'>,
  ) {
    this.items = result.items.map((item) =>
      ProductListItemResponseDto.from(item),
    );
    this.page = filter.page;
    this.size = filter.size;
    this.totalCount = result.totalCount;
    this.hasMore = result.hasMore;
  }

  static from(
    result: ProductListResult,
    filter: Pick<ProductListFilter, 'page' | 'size'>,
  ): ProductListResponseDto {
    return new ProductListResponseDto(result, filter);
  }
}
