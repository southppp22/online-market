import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { ProductNotFoundError } from '../domain/product.errors';
import { Product } from '../domain/product.entity';
import {
  ProductListFilter,
  ProductListItem,
  ProductRepository,
} from '../domain/product.repository';
import { Sku } from '../domain/sku.entity';
import { SkuNotFoundError } from '../domain/sku.errors';

interface StockChangeItem {
  skuId: string;
  quantity: number;
}

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async listProducts(filter: ProductListFilter): Promise<ProductListItem[]> {
    return this.productRepository.findMany(filter);
  }

  async listRecommendedProducts(size: number): Promise<ProductListItem[]> {
    return this.productRepository.findRecommended(size);
  }

  async getProductDetail(productId: string): Promise<Product> {
    const product = await this.productRepository.findByIdWithSkus(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }
    return product;
  }

  async findSkusWithProduct(skuIds: string[]): Promise<Sku[]> {
    return this.productRepository.findSkusWithProductByIds(skuIds);
  }

  @Transactional()
  async deductStocks(items: StockChangeItem[]): Promise<void> {
    const skus = await this.productRepository.findSkusByIdsForUpdate(
      items.map((item) => item.skuId),
    );
    for (const item of items) {
      const sku = skus.find((candidate) => candidate.id === item.skuId);
      if (!sku) {
        throw new SkuNotFoundError(item.skuId);
      }
      sku.assertAddableToCart();
      sku.decreaseStock(item.quantity);
    }
    await this.productRepository.saveSkus(skus);
  }

  @Transactional()
  async restoreStocks(items: StockChangeItem[]): Promise<void> {
    const skus = await this.productRepository.findSkusByIdsForUpdate(
      items.map((item) => item.skuId),
    );
    for (const item of items) {
      const sku = skus.find((candidate) => candidate.id === item.skuId);
      if (!sku) {
        throw new SkuNotFoundError(item.skuId);
      }
      sku.increaseStock(item.quantity);
    }
    await this.productRepository.saveSkus(skus);
  }
}
