import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { In, IsNull, SelectQueryBuilder } from 'typeorm';
import { ProductCategory } from '../domain/product-category';
import { Product } from '../domain/product.entity';
import {
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
  isSoldOut: string;
}

@Injectable()
export class TypeOrmProductRepository extends ProductRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super();
  }

  async findMany(filter: ProductListFilter): Promise<ProductListResult> {
    const totalCount = await this.buildFilteredQuery(filter).getCount();
    const rows = await this.buildListQuery(filter).getRawMany<ProductListRow>();
    return { items: rows.map((row) => this.toListItem(row)), totalCount };
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
    if (filter.recommended) {
      qb.andWhere('product.isRecommended = true');
    }
    return qb;
  }

  private buildListQuery(
    filter: ProductListFilter,
  ): SelectQueryBuilder<Product> {
    const qb = this.buildFilteredQuery(filter)
      .leftJoin('product.skus', 'sku')
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('product.basePrice', 'basePrice')
      .addSelect('product.category', 'category')
      .addSelect(
        'CASE WHEN COALESCE(SUM(sku.stock), 0) = 0 THEN 1 ELSE 0 END',
        'isSoldOut',
      )
      .groupBy('product.id')
      .offset((filter.page - 1) * filter.size)
      .limit(filter.size);
    this.applySort(qb, filter.sort);
    return qb;
  }

  private applySort(qb: SelectQueryBuilder<Product>, sort: ProductSort): void {
    if (sort === 'priceAsc') {
      qb.orderBy('product.basePrice', 'ASC');
    } else if (sort === 'priceDesc') {
      qb.orderBy('product.basePrice', 'DESC');
    } else {
      qb.orderBy('product.createdAt', 'DESC');
    }
    // 1차 정렬 키가 같은 행들의 순서를 고정해 페이지 간 중복·누락을 막는다.
    qb.addOrderBy('product.id', 'DESC');
  }

  private escapeLikeKeyword(keyword: string): string {
    // LIKE의 와일드카드(%, _)와 이스케이프 문자(\) 자체를 리터럴로 취급하기 위해 이스케이프한다.
    return keyword.replace(/[\\%_]/g, '\\$&');
  }

  private toListItem(row: ProductListRow): ProductListItem {
    return {
      id: row.id,
      name: row.name,
      basePrice: Number(row.basePrice),
      category: row.category,
      isSoldOut: Number(row.isSoldOut) === 1,
    };
  }
}
