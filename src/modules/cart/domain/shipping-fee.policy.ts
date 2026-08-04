export const FREE_SHIPPING_THRESHOLD = 30000;
export const DEFAULT_SHIPPING_FEE = 3000;

export function calculateShippingFee(itemsAmount: number): number {
  if (itemsAmount === 0) return 0;
  return itemsAmount >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
}
