import { calculateShippingFee } from './shipping-fee.policy';

describe('calculateShippingFee', () => {
  it('itemsAmount가 0이면 0을 반환한다', () => {
    expect(calculateShippingFee(0)).toBe(0);
  });

  it('itemsAmount가 29999면 3000을 반환한다', () => {
    expect(calculateShippingFee(29999)).toBe(3000);
  });

  it('itemsAmount가 30000이면 0을 반환한다', () => {
    expect(calculateShippingFee(30000)).toBe(0);
  });
});
