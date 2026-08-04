export interface CartLineView {
  id: string;
  skuId: string;
  productName: string;
  optionName: string;
  price: number;
  quantity: number;
  lineAmount: number;
  isSoldOut: boolean;
}

export interface CartView {
  items: CartLineView[];
  itemsAmount: number;
  shippingFee: number;
  totalAmount: number;
}
