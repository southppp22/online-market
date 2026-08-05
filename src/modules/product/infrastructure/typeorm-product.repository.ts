import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { In, IsNull, SelectQueryBuilder } from 'typeorm';
import { ProductCategory } from '../domain/product-category';
import { Product } from '../domain/product.entity';
import {
  PRODUCT_LIST_MAX_RESULTS,
  ProductListFilter,
  ProductListItem,
  ProductListResult,
  ProductRepository,
  ProductSort,
} from '../domain/product.repository';
import { Sku } from '../domain/sku.entity';

interface ProductListRow {
  id: string;
  name: string;
  basePrice: string;
  category: ProductCategory;
}

@Injectable()
export class TypeOrmProductRepository extends ProductRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super();
  }

  async findMany(filter: ProductListFilter): Promise<ProductListResult> {
    const { totalCount, hasMore } = await this.countUpToMax(filter);
    const pageIds = await this.findPageIds(filter);
    const rowById = await this.findListRowsByIds(pageIds);
    const stockByProductId = await this.sumStocksByProductIds(pageIds);
    const items = pageIds
      .map((id) => rowById.get(id))
      .filter((row): row is ProductListRow => row !== undefined)
      .map((row) => this.toListItem(row, stockByProductId));
    return { items, totalCount, hasMore };
  }

  async findRecommended(size: number): Promise<ProductListItem[]> {
    const rows = await this.txHost.tx
      .createQueryBuilder(Product, 'product')
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('product.basePrice', 'basePrice')
      .addSelect('product.category', 'category')
      .where('product.deletedAt IS NULL')
      .andWhere('product.isRecommended = true')
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'DESC')
      .limit(size)
      .getRawMany<ProductListRow>();
    const stockByProductId = await this.sumStocksByProductIds(
      rows.map((row) => row.id),
    );
    return rows.map((row) => this.toListItem(row, stockByProductId));
  }

  async findByIdWithSkus(id: string): Promise<Product | null> {
    return this.txHost.tx.findOne(Product, {
      where: { id, deletedAt: IsNull() },
      relations: { skus: true },
    });
  }

  async findSkusByIdsForUpdate(skuIds: string[]): Promise<Sku[]> {
    if (skuIds.length === 0) return [];
    // 정렬 없이 잠그면 트랜잭션 간 교착상태가 발생할 수 있어 id 오름차순으로 정렬 후 잠근다.
    const sortedIds = [...skuIds].sort();
    return this.txHost.tx
      .createQueryBuilder(Sku, 'sku')
      .leftJoinAndSelect('sku.product', 'product')
      .where('sku.id IN (:...sortedIds)', { sortedIds })
      .orderBy('sku.id', 'ASC')
      .setLock('pessimistic_write')
      .getMany();
  }

  async findSkusWithProductByIds(skuIds: string[]): Promise<Sku[]> {
    if (skuIds.length === 0) return [];
    // 소프트 삭제된 상품의 SKU도 포함해서 조회한다.
    return this.txHost.tx.find(Sku, {
      where: { id: In(skuIds) },
      relations: { product: true },
    });
  }

  async saveSkus(skus: Sku[]): Promise<void> {
    await this.txHost.tx.save(skus);
  }

  private buildFilteredQuery(
    filter: ProductListFilter,
  ): SelectQueryBuilder<Product> {
    const qb = this.txHost.tx
      .createQueryBuilder(Product, 'product')
      .where('product.deletedAt IS NULL');

    if (filter.keyword) {
      qb.andWhere("product.name LIKE :keyword ESCAPE '\\\\'", {
        keyword: `%${this.escapeLikeKeyword(filter.keyword)}%`,
      });
    }
    if (filter.category) {
      qb.andWhere('product.category = :category', {
        category: filter.category,
      });
    }
    if (filter.minPrice !== undefined) {
      qb.andWhere('product.basePrice >= :minPrice', {
        minPrice: filter.minPrice,
      });
    }
    if (filter.maxPrice !== undefined) {
      qb.andWhere('product.basePrice <= :maxPrice', {
        maxPrice: filter.maxPrice,
      });
    }
    if (filter.isSoldOut !== undefined) {
      const exists =
        'EXISTS (SELECT 1 FROM skus sku WHERE sku.productId = product.id AND sku.stock > 0)';
      qb.andWhere(filter.isSoldOut ? `NOT ${exists}` : exists);
    }
    return qb;
  }

  private async countUpToMax(
    filter: ProductListFilter,
  ): Promise<{ totalCount: number; hasMore: boolean }> {
    const inner = this.buildFilteredQuery(filter)
      .select('product.id')
      .limit(PRODUCT_LIST_MAX_RESULTS + 1);
    const [sql, params] = inner.getQueryAndParameters();
    const rows: { cnt: string }[] = await this.txHost.tx.query(
      `SELECT COUNT(1) AS cnt FROM (${sql}) t`,
      params,
    );
    const count = Number(rows[0].cnt);
    return {
      totalCount: Math.min(count, PRODUCT_LIST_MAX_RESULTS),
      hasMore: count > PRODUCT_LIST_MAX_RESULTS,
    };
  }

  // id만 골라야 오프셋 스킵이 정렬 인덱스만 읽는다 (행 조회는 확정된 size건만).
  private async findPageIds(filter: ProductListFilter): Promise<string[]> {
    const qb = this.buildFilteredQuery(filter)
      .select('product.id', 'id')
      .offset((filter.page - 1) * filter.size)
      .limit(filter.size);
    this.applySort(qb, filter.sort);
    const rows = await qb.getRawMany<{ id: string }>();
    return rows.map((row) => row.id);
  }

  private async findListRowsByIds(
    ids: string[],
  ): Promise<Map<string, ProductListRow>> {
    if (ids.length === 0) return new Map();
    const rows = await this.txHost.tx
      .createQueryBuilder(Product, 'product')
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('product.basePrice', 'basePrice')
      .addSelect('product.category', 'category')
      .where('product.id IN (:...ids)', { ids })
      .getRawMany<ProductListRow>();
    return new Map(rows.map((row) => [row.id, row]));
  }

  private async sumStocksByProductIds(
    productIds: string[],
  ): Promise<Map<string, number>> {
    if (productIds.length === 0) return new Map();
    const rows = await this.txHost.tx
      .createQueryBuilder(Sku, 'sku')
      .select('sku.productId', 'productId')
      .addSelect('SUM(sku.stock)', 'totalStock')
      .where('sku.productId IN (:...productIds)', { productIds })
      .groupBy('sku.productId')
      .getRawMany<{ productId: string; totalStock: string }>();
    return new Map(rows.map((row) => [row.productId, Number(row.totalStock)]));
  }

  // 보조 정렬 id는 1차 정렬과 같은 방향이어야 인덱스 스캔만으로 정렬된다 (filesort 방지).
  private applySort(qb: SelectQueryBuilder<Product>, sort: ProductSort): void {
    if (sort === 'priceAsc') {
      qb.orderBy('product.basePrice', 'ASC').addOrderBy('product.id', 'ASC');
    } else if (sort === 'priceDesc') {
      qb.orderBy('product.basePrice', 'DESC').addOrderBy('product.id', 'DESC');
    } else {
      qb.orderBy('product.createdAt', 'DESC').addOrderBy('product.id', 'DESC');
    }
  }

  private escapeLikeKeyword(keyword: string): string {
    // LIKE의 와일드카드(%, _)와 이스케이프 문자(\) 자체를 리터럴로 취급하기 위해 이스케이프한다.
    return keyword.replace(/[\\%_]/g, '\\$&');
  }

  private toListItem(
    row: ProductListRow,
    stockByProductId: Map<string, number>,
  ): ProductListItem {
    return {
      id: row.id,
      name: row.name,
      basePrice: Number(row.basePrice),
      category: row.category,
      isSoldOut: (stockByProductId.get(row.id) ?? 0) === 0,
    };
  }
}
