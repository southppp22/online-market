import { InvalidOrderAmountError } from './order.errors';

export const FREE_SHIPPING_THRESHOLD = 30000;
export const DEFAULT_SHIPPING_FEE = 3000;

export class OrderAmounts {
  private constructor(
    readonly itemsAmount: number,
    readonly discountAmount: number,
    readonly shippingFee: number,
    readonly totalAmount: number,
  ) {}

  static create(params: {
    lineAmounts: number[];
    couponDiscount: number;
  }): OrderAmounts {
    const itemsAmount = params.lineAmounts.reduce((sum, a) => sum + a, 0);
    const discountAmount = Math.min(params.couponDiscount, itemsAmount);
    const shippingFee =
      itemsAmount >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
    const totalAmount = itemsAmount - discountAmount + shippingFee;
    if (totalAmount < 0) {
      throw new InvalidOrderAmountError(totalAmount);
    }
    return new OrderAmounts(
      itemsAmount,
      discountAmount,
      shippingFee,
      totalAmount,
    );
  }
}
