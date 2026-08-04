import { ProductCategory } from '../../domain/product-category';
import {
  ProductListFilter,
  ProductListItem,
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

  private constructor(
    items: ProductListItem[],
    page: number,
    size: number,
    totalCount: number,
  ) {
    this.items = items.map((item) => ProductListItemResponseDto.from(item));
    this.page = page;
    this.size = size;
    this.totalCount = totalCount;
  }

  static from(
    result: { items: ProductListItem[]; totalCount: number },
    filter: Pick<ProductListFilter, 'page' | 'size'>,
  ): ProductListResponseDto {
    return new ProductListResponseDto(
      result.items,
      filter.page,
      filter.size,
      result.totalCount,
    );
  }
}
