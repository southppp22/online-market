import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ProductCategory } from '../../domain/product-category';
import type {
  ProductListFilter,
  ProductSort,
} from '../../domain/product.repository';

export class ProductListQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(Object.values(ProductCategory))
  category?: ProductCategory;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxPrice?: number;

  @IsOptional()
  @IsIn(['true', 'false'])
  recommended?: string;

  @IsOptional()
  @IsIn(['latest', 'priceAsc', 'priceDesc'])
  sort: ProductSort = 'latest';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 20;

  toFilter(): ProductListFilter {
    return {
      keyword: this.keyword,
      category: this.category,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      recommended: this.recommended === 'true' ? true : undefined,
      sort: this.sort,
      page: this.page,
      size: this.size,
    };
  }
}
