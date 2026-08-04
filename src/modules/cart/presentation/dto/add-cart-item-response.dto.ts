export class AddCartItemResponseDto {
  cartItemId: string;

  private constructor(cartItemId: string) {
    this.cartItemId = cartItemId;
  }

  static from(cartItemId: string): AddCartItemResponseDto {
    return new AddCartItemResponseDto(cartItemId);
  }
}
