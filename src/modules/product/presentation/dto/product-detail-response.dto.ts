import { ProductCategory } from '../../domain/product-category';
import { Product } from '../../domain/product.entity';

export class ProductSkuResponseDto {
  id: string;
  optionName: string;
  price: number;
  isSoldOut: boolean;

  private constructor(sku: {
    id: string;
    optionName: string;
    price: number;
    isSoldOut: boolean;
  }) {
    this.id = sku.id;
    this.optionName = sku.optionName;
    this.price = sku.price;
    this.isSoldOut = sku.isSoldOut;
  }

  static from(sku: {
    id: string;
    optionName: string;
    price: number;
    isSoldOut: boolean;
  }): ProductSkuResponseDto {
    return new ProductSkuResponseDto(sku);
  }
}

export class ProductDetailResponseDto {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: ProductCategory;
  skus: ProductSkuResponseDto[];

  private constructor(product: Product) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.basePrice = product.basePrice;
    this.category = product.category;
    this.skus = product.skus.map((sku) =>
      ProductSkuResponseDto.from({
        id: sku.id,
        optionName: sku.optionName,
        price: sku.price,
        isSoldOut: sku.isSoldOut(),
      }),
    );
  }

  static from(product: Product): ProductDetailResponseDto {
    return new ProductDetailResponseDto(product);
  }
}
