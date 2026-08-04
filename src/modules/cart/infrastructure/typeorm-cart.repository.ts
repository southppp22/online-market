import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CartItem } from '../domain/cart-item.entity';
import { DuplicateCartItemError } from '../domain/cart.errors';
import { CartRepository } from '../domain/cart.repository';

@Injectable()
export class TypeOrmCartRepository extends CartRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super();
  }

  async findByUser(userId: string): Promise<CartItem[]> {
    return this.txHost.tx.find(CartItem, {
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserAndSkuForUpdate(
    userId: string,
    skuId: string,
  ): Promise<CartItem | null> {
    return this.txHost.tx
      .createQueryBuilder(CartItem, 'cartItem')
      .where('cartItem.userId = :userId', { userId })
      .andWhere('cartItem.skuId = :skuId', { skuId })
      .setLock('pessimistic_write')
      .getOne();
  }

  async findByIdAndUserId(
    cartItemId: string,
    userId: string,
  ): Promise<CartItem | null> {
    return this.txHost.tx.findOneBy(CartItem, {
      id: cartItemId,
      userId,
    });
  }

  async save(cartItem: CartItem): Promise<void> {
    try {
      await this.txHost.tx.save(cartItem);
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new DuplicateCartItemError(cartItem.skuId);
      }
      throw error;
    }
  }

  async remove(cartItem: CartItem): Promise<void> {
    await this.txHost.tx.remove(cartItem);
  }

  private isDuplicateEntry(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    return (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY';
  }
}
