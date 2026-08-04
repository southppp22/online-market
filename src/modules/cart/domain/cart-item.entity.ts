import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import {
  CartQuantityExceededError,
  InvalidCartQuantityError,
} from './cart.errors';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

@Entity('cart_items')
@Unique(['userId', 'skuId'])
export class CartItem {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  skuId: string;

  @Column()
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static create(userId: string, skuId: string, quantity: number): CartItem {
    const cartItem = new CartItem();
    cartItem.id = uuidv7();
    cartItem.userId = userId;
    cartItem.skuId = skuId;
    cartItem.changeQuantity(quantity);
    return cartItem;
  }

  addQuantity(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new InvalidCartQuantityError(amount);
    }
    const next = this.quantity + amount;
    if (next > MAX_QUANTITY) {
      throw new CartQuantityExceededError(this.skuId);
    }
    this.quantity = next;
  }

  changeQuantity(quantity: number): void {
    if (
      !Number.isInteger(quantity) ||
      quantity < MIN_QUANTITY ||
      quantity > MAX_QUANTITY
    ) {
      throw new InvalidCartQuantityError(quantity);
    }
    this.quantity = quantity;
  }
}
