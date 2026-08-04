import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { OrderItem } from '../domain/order-item.entity';
import { Order } from '../domain/order.entity';
import { DuplicateIdempotencyKeyError } from '../domain/order.errors';
import {
  OrderListFilter,
  OrderListResult,
  OrderRepository,
} from '../domain/order.repository';

@Injectable()
export class TypeOrmOrderRepository extends OrderRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super();
  }

  async findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<Order | null> {
    return this.txHost.tx.findOneBy(Order, {
      userId,
      idempotencyKey,
    });
  }

  async findWithItemsByIdAndUserId(
    orderId: string,
    userId: string,
  ): Promise<Order | null> {
    return this.txHost.tx.findOne(Order, {
      where: { id: orderId, userId },
      relations: { items: true },
    });
  }

  async findByIdAndUserIdForUpdate(
    orderId: string,
    userId: string,
  ): Promise<Order | null> {
    const manager = this.txHost.tx;
    const order = await manager
      .createQueryBuilder(Order, 'order')
      .where('order.id = :orderId', { orderId })
      .andWhere('order.userId = :userId', { userId })
      .setLock('pessimistic_write')
      .getOne();
    if (!order) {
      return null;
    }
    // 락 범위를 orders 행으로 한정하기 위해 items는 조인하지 않고 별도 조회한다.
    order.items = await manager.findBy(OrderItem, { orderId });
    return order;
  }

  async findPageByUser(
    userId: string,
    filter: OrderListFilter,
  ): Promise<OrderListResult> {
    const qb = this.txHost.tx
      .createQueryBuilder(Order, 'order')
      .where('order.userId = :userId', { userId });
    if (filter.status) {
      qb.andWhere('order.status = :status', { status: filter.status });
    }
    const [items, totalCount] = await qb
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('order.id', 'DESC')
      .skip((filter.page - 1) * filter.size)
      .take(filter.size)
      .getManyAndCount();
    return { items, totalCount };
  }

  async save(order: Order): Promise<void> {
    try {
      await this.txHost.tx.save(order);
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new DuplicateIdempotencyKeyError(order.idempotencyKey);
      }
      throw error;
    }
  }

  private isDuplicateEntry(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    return (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY';
  }
}
