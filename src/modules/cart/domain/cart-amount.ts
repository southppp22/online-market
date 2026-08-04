import { calculateShippingFee } from './shipping-fee.policy';

export interface CartAmountSummary {
  itemsAmount: number;
  shippingFee: number;
  totalAmount: number;
}

export function calculateCartAmount(lineAmounts: number[]): CartAmountSummary {
  const itemsAmount = lineAmounts.reduce((sum, amount) => sum + amount, 0);
  const shippingFee = calculateShippingFee(itemsAmount);
  return { itemsAmount, shippingFee, totalAmount: itemsAmount + shippingFee };
}

export function calculateLineAmount(price: number, quantity: number): number {
  return price * quantity;
}
