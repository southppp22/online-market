import { CartItem } from '../../src/modules/cart/domain/cart-item.entity';

export function createTestCartItem(
  overrides: Partial<CartItem> = {},
): CartItem {
  const cartItem = new CartItem();
  cartItem.id = overrides.id ?? '019fb1da-b166-7358-a4f4-1d61ba0be632';
  cartItem.userId = overrides.userId ?? '019fb1da-b166-7358-a4f4-1d61ba0be630';
  cartItem.skuId = overrides.skuId ?? '019fb1da-b166-7358-a4f4-1d61ba0be631';
  cartItem.quantity = overrides.quantity ?? 1;
  return cartItem;
}
