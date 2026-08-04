import { createTestOrderItem } from '../../../../test/fixtures/order.fixture';
import { OrderItem } from './order-item.entity';

describe('OrderItem', () => {
  describe('create', () => {
    it('주문 시점 스냅샷 필드가 모두 설정되고 id가 할당된다', () => {
      const item = OrderItem.create({
        skuId: '019fb1da-b166-7358-a4f4-1d61ba0be631',
        productName: '무선 이어폰',
        optionName: '블랙',
        price: 10000,
        quantity: 2,
      });

      expect(item.id).toEqual(expect.any(String));
      expect(item.skuId).toBe('019fb1da-b166-7358-a4f4-1d61ba0be631');
      expect(item.productName).toBe('무선 이어폰');
      expect(item.optionName).toBe('블랙');
      expect(item.price).toBe(10000);
      expect(item.quantity).toBe(2);
    });
  });

  describe('lineAmount', () => {
    it('price * quantity를 반환한다', () => {
      const item = createTestOrderItem({ price: 10000, quantity: 3 });

      expect(item.lineAmount()).toBe(30000);
    });
  });
});
