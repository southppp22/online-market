import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { ProductService } from '../../product/application/product.service';
import { Sku } from '../../product/domain/sku.entity';
import { SkuNotFoundError } from '../../product/domain/sku.errors';
import {
  calculateCartAmount,
  calculateLineAmount,
} from '../domain/cart-amount';
import { CartItem } from '../domain/cart-item.entity';
import {
  CartItemNotFoundError,
  DuplicateCartItemError,
} from '../domain/cart.errors';
import { CartRepository } from '../domain/cart.repository';
import { CartLineView, CartView } from '../domain/cart-view';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productService: ProductService,
  ) {}

  async getCart(userId: string): Promise<CartView> {
    const cartItems = await this.cartRepository.findByUser(userId);
    const skus = await this.productService.findSkusWithProduct(
      cartItems.map((item) => item.skuId),
    );
    const lines = this.toCartLines(cartItems, skus);
    const amount = calculateCartAmount(lines.map((line) => line.lineAmount));
    return { items: lines, ...amount };
  }

  async addItem(
    userId: string,
    skuId: string,
    quantity: number,
  ): Promise<string> {
    const [sku] = await this.productService.findSkusWithProduct([skuId]);
    if (!sku) {
      throw new SkuNotFoundError(skuId);
    }
    sku.assertAddableToCart();

    try {
      return await this.upsertCartItem(userId, skuId, quantity);
    } catch (error) {
      if (!(error instanceof DuplicateCartItemError)) {
        throw error;
      }
      return this.upsertCartItem(userId, skuId, quantity);
    }
  }

  @Transactional()
  private async upsertCartItem(
    userId: string,
    skuId: string,
    quantity: number,
  ): Promise<string> {
    const existing = await this.cartRepository.findByUserAndSkuForUpdate(
      userId,
      skuId,
    );
    if (existing) {
      existing.addQuantity(quantity);
      await this.cartRepository.save(existing);
      return existing.id;
    }

    const cartItem = CartItem.create(userId, skuId, quantity);
    await this.cartRepository.save(cartItem);
    return cartItem.id;
  }

  async changeQuantity(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<void> {
    const cartItem = await this.cartRepository.findByIdAndUserId(
      cartItemId,
      userId,
    );
    if (!cartItem) {
      throw new CartItemNotFoundError(cartItemId);
    }
    cartItem.changeQuantity(quantity);
    await this.cartRepository.save(cartItem);
  }

  async removeItem(userId: string, cartItemId: string): Promise<void> {
    const cartItem = await this.cartRepository.findByIdAndUserId(
      cartItemId,
      userId,
    );
    if (!cartItem) {
      throw new CartItemNotFoundError(cartItemId);
    }
    await this.cartRepository.remove(cartItem);
  }

  private toCartLines(cartItems: CartItem[], skus: Sku[]): CartLineView[] {
    const skuById = new Map(skus.map((sku) => [sku.id, sku]));

    const lines: CartLineView[] = [];
    for (const item of cartItems) {
      const sku = skuById.get(item.skuId);
      if (!sku) continue;
      lines.push({
        id: item.id,
        skuId: item.skuId,
        productName: sku.product.name,
        optionName: sku.optionName,
        price: sku.price,
        quantity: item.quantity,
        lineAmount: calculateLineAmount(sku.price, item.quantity),
        isSoldOut: sku.isUnavailable(),
      });
    }
    return lines;
  }
}
