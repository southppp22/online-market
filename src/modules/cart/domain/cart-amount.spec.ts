import { calculateCartAmount } from './cart-amount';

describe('calculateCartAmount', () => {
  it('빈 장바구니면 모든 금액이 0이다', () => {
    const actual = calculateCartAmount([]);

    expect(actual).toEqual({ itemsAmount: 0, shippingFee: 0, totalAmount: 0 });
  });

  it('itemsAmount가 29999면 배송비 3000이 붙는다', () => {
    const actual = calculateCartAmount([29999]);

    expect(actual).toEqual({
      itemsAmount: 29999,
      shippingFee: 3000,
      totalAmount: 32999,
    });
  });

  it('itemsAmount가 30000이면 배송비가 무료다', () => {
    const actual = calculateCartAmount([20000, 10000]);

    expect(actual).toEqual({
      itemsAmount: 30000,
      shippingFee: 0,
      totalAmount: 30000,
    });
  });
});
