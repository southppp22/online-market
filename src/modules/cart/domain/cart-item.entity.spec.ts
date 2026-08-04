import { createTestCartItem } from '../../../../test/fixtures/cart.fixture';
import { CartItem } from './cart-item.entity';
import {
  CartQuantityExceededError,
  InvalidCartQuantityError,
} from './cart.errors';

function createCartItem(quantity: number): CartItem {
  return createTestCartItem({ quantity });
}

describe('CartItem', () => {
  describe('create', () => {
    const userId = '019fb1da-b166-7358-a4f4-1d61ba0be631';
    const skuId = '019fb1da-b166-7358-a4f4-1d61ba0be632';

    it('유효한 값이면 필드가 모두 설정되고 id가 할당된다', () => {
      const cartItem = CartItem.create(userId, skuId, 5);

      expect(cartItem.id).toEqual(expect.any(String));
      expect(cartItem.userId).toBe(userId);
      expect(cartItem.skuId).toBe(skuId);
      expect(cartItem.quantity).toBe(5);
    });

    it('경계값 1과 99를 허용한다', () => {
      expect(CartItem.create(userId, skuId, 1).quantity).toBe(1);
      expect(CartItem.create(userId, skuId, 99).quantity).toBe(99);
    });

    it('0이면 InvalidCartQuantityError를 던진다', () => {
      expect(() => CartItem.create(userId, skuId, 0)).toThrow(
        InvalidCartQuantityError,
      );
    });

    it('100이면 InvalidCartQuantityError를 던진다', () => {
      expect(() => CartItem.create(userId, skuId, 100)).toThrow(
        InvalidCartQuantityError,
      );
    });

    it('소수면 InvalidCartQuantityError를 던진다', () => {
      expect(() => CartItem.create(userId, skuId, 1.5)).toThrow(
        InvalidCartQuantityError,
      );
    });
  });

  describe('addQuantity', () => {
    it('합산 결과가 99 이하면 수량을 더한다', () => {
      const cartItem = createCartItem(10);

      cartItem.addQuantity(5);

      expect(cartItem.quantity).toBe(15);
    });

    it('합산 결과가 99를 초과하면 CartQuantityExceededError를 던진다', () => {
      const cartItem = createCartItem(95);

      expect(() => cartItem.addQuantity(5)).toThrow(CartQuantityExceededError);
    });

    it('합산 결과가 정확히 99면 허용한다', () => {
      const cartItem = createCartItem(94);

      cartItem.addQuantity(5);

      expect(cartItem.quantity).toBe(99);
    });

    it('음수면 InvalidCartQuantityError를 던진다', () => {
      const cartItem = createCartItem(1);

      expect(() => cartItem.addQuantity(-1)).toThrow(InvalidCartQuantityError);
    });

    it('0이면 InvalidCartQuantityError를 던진다', () => {
      const cartItem = createCartItem(1);

      expect(() => cartItem.addQuantity(0)).toThrow(InvalidCartQuantityError);
    });

    it('소수면 InvalidCartQuantityError를 던진다', () => {
      const cartItem = createCartItem(1);

      expect(() => cartItem.addQuantity(1.5)).toThrow(InvalidCartQuantityError);
    });
  });

  describe('changeQuantity', () => {
    it('1~99 사이 정수면 수량을 변경한다', () => {
      const cartItem = createCartItem(1);

      cartItem.changeQuantity(50);

      expect(cartItem.quantity).toBe(50);
    });

    it('0이면 InvalidCartQuantityError를 던진다', () => {
      const cartItem = createCartItem(1);

      expect(() => cartItem.changeQuantity(0)).toThrow(
        InvalidCartQuantityError,
      );
    });

    it('100이면 InvalidCartQuantityError를 던진다', () => {
      const cartItem = createCartItem(1);

      expect(() => cartItem.changeQuantity(100)).toThrow(
        InvalidCartQuantityError,
      );
    });

    it('소수면 InvalidCartQuantityError를 던진다', () => {
      const cartItem = createCartItem(1);

      expect(() => cartItem.changeQuantity(1.5)).toThrow(
        InvalidCartQuantityError,
      );
    });
  });
});
