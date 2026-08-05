import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidationArguments,
  registerDecorator,
} from 'class-validator';
import { ProductCategory } from '../../domain/product-category';
import { PRODUCT_LIST_MAX_RESULTS } from '../../domain/product.repository';
import type {
  ProductListFilter,
  ProductSort,
} from '../../domain/product.repository';

function WithinMaxResults() {
  return (object: object, propertyName: string): void =>
    registerDecorator({
      name: 'withinMaxResults',
      target: object.constructor,
      propertyName,
      validator: {
        validate: (page: number, args: ValidationArguments): boolean =>
          (page - 1) * (args.object as ProductListQueryDto).size <
          PRODUCT_LIST_MAX_RESULTS,
        defaultMessage: (): string =>
          `page와 size의 조합이 조회 상한(${PRODUCT_LIST_MAX_RESULTS}건)을 넘습니다`,
      },
    });
}

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
  isSoldOut?: string;

  @IsOptional()
  @IsIn(['latest', 'priceAsc', 'priceDesc'])
  sort: ProductSort = 'latest';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @WithinMaxResults()
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
      isSoldOut:
        this.isSoldOut === undefined ? undefined : this.isSoldOut === 'true',
      sort: this.sort,
      page: this.page,
      size: this.size,
    };
  }
}
