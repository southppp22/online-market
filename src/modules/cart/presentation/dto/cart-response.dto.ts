import { CartLineView, CartView } from '../../domain/cart-view';

export class CartItemResponseDto {
  id: string;
  skuId: string;
  productName: string;
  optionName: string;
  price: number;
  quantity: number;
  lineAmount: number;
  isSoldOut: boolean;

  private constructor(line: CartLineView) {
    this.id = line.id;
    this.skuId = line.skuId;
    this.productName = line.productName;
    this.optionName = line.optionName;
    this.price = line.price;
    this.quantity = line.quantity;
    this.lineAmount = line.lineAmount;
    this.isSoldOut = line.isSoldOut;
  }

  static from(line: CartLineView): CartItemResponseDto {
    return new CartItemResponseDto(line);
  }
}

export class CartResponseDto {
  items: CartItemResponseDto[];
  itemsAmount: number;
  shippingFee: number;
  totalAmount: number;

  private constructor(cart: CartView) {
    this.items = cart.items.map((line) => CartItemResponseDto.from(line));
    this.itemsAmount = cart.itemsAmount;
    this.shippingFee = cart.shippingFee;
    this.totalAmount = cart.totalAmount;
  }

  static from(cart: CartView): CartResponseDto {
    return new CartResponseDto(cart);
  }
}
