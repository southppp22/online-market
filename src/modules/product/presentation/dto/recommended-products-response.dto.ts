import { ProductListItem } from '../../domain/product.repository';
import { ProductListItemResponseDto } from './product-list-response.dto';

export class RecommendedProductsResponseDto {
  items: ProductListItemResponseDto[];

  private constructor(items: ProductListItem[]) {
    this.items = items.map((item) => ProductListItemResponseDto.from(item));
  }

  static from(items: ProductListItem[]): RecommendedProductsResponseDto {
    return new RecommendedProductsResponseDto(items);
  }
}
