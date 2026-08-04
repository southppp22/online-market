import {
  DEFAULT_SHIPPING_FEE as CART_DEFAULT_SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD as CART_FREE_SHIPPING_THRESHOLD,
} from '../../cart/domain/shipping-fee.policy';
import {
  DEFAULT_SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  OrderAmounts,
} from './order-amounts';

describe('OrderAmounts', () => {
  describe('create', () => {
    it('itemsAmount는 lineAmounts의 합이고 총액은 상품 금액 − 할인 + 배송비다', () => {
      const amounts = OrderAmounts.create({
        lineAmounts: [10000, 5000],
        couponDiscount: 3000,
      });

      expect(amounts.itemsAmount).toBe(15000);
      expect(amounts.discountAmount).toBe(3000);
      expect(amounts.shippingFee).toBe(3000);
      expect(amounts.totalAmount).toBe(15000);
    });

    it('할인액이 상품 금액을 넘으면 상품 금액까지만 할인한다', () => {
      const amounts = OrderAmounts.create({
        lineAmounts: [3000],
        couponDiscount: 5000,
      });

      expect(amounts.discountAmount).toBe(3000);
      expect(amounts.totalAmount).toBeGreaterThanOrEqual(0);
    });

    it('할인 캡 덕에 할인액이 아무리 커도 총액은 음수가 되지 않는다', () => {
      const amounts = OrderAmounts.create({
        lineAmounts: [1000],
        couponDiscount: 1_000_000,
      });

      expect(amounts.discountAmount).toBe(1000);
      expect(amounts.totalAmount).toBe(DEFAULT_SHIPPING_FEE);
      expect(amounts.totalAmount).toBeGreaterThanOrEqual(0);
    });

    it('상품 금액 29,999원이면 배송비 3,000원이 붙는다', () => {
      const amounts = OrderAmounts.create({
        lineAmounts: [29999],
        couponDiscount: 0,
      });

      expect(amounts.shippingFee).toBe(3000);
      expect(amounts.totalAmount).toBe(32999);
    });

    it('상품 금액 30,000원이면 배송비가 무료다', () => {
      const amounts = OrderAmounts.create({
        lineAmounts: [30000],
        couponDiscount: 0,
      });

      expect(amounts.shippingFee).toBe(0);
      expect(amounts.totalAmount).toBe(30000);
    });

    it('배송비는 할인 전 상품 금액 기준이다 — 쿠폰 할인으로 배송비가 생기지 않는다', () => {
      const amounts = OrderAmounts.create({
        lineAmounts: [30000],
        couponDiscount: 5000,
      });

      expect(amounts.shippingFee).toBe(0);
      expect(amounts.totalAmount).toBe(25000);
    });
  });

  describe('배송비 정책 상수 가드', () => {
    it('order의 배송비 정책 값은 cart의 정책 값과 같아야 한다 (의도적 중복 — 변경 시 양쪽 함께 수정)', () => {
      expect(FREE_SHIPPING_THRESHOLD).toBe(CART_FREE_SHIPPING_THRESHOLD);
      expect(DEFAULT_SHIPPING_FEE).toBe(CART_DEFAULT_SHIPPING_FEE);
    });
  });
});
