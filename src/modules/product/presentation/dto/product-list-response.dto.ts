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

  private constructor(
    items: ProductListItem[],
    filter: Pick<ProductListFilter, 'page' | 'size'>,
  ) {
    this.items = items.map((item) => ProductListItemResponseDto.from(item));
    this.page = filter.page;
    this.size = filter.size;
  }

  static from(
    items: ProductListItem[],
    filter: Pick<ProductListFilter, 'page' | 'size'>,
  ): ProductListResponseDto {
    return new ProductListResponseDto(items, filter);
  }
}
