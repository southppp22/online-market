import { CartItem } from './cart-item.entity';

export abstract class CartRepository {
  abstract findByUser(userId: string): Promise<CartItem[]>;
  abstract findByUserAndSkuForUpdate(
    userId: string,
    skuId: string,
  ): Promise<CartItem | null>;
  abstract findByIdAndUserId(
    cartItemId: string,
    userId: string,
  ): Promise<CartItem | null>;
  abstract save(cartItem: CartItem): Promise<void>;
  abstract remove(cartItem: CartItem): Promise<void>;
}
