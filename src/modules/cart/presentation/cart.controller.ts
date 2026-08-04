import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { CartService } from '../application/cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { AddCartItemResponseDto } from './dto/add-cart-item-response.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { ChangeCartItemQuantityDto } from './dto/change-cart-item-quantity.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() userId: string): Promise<CartResponseDto> {
    const cart = await this.cartService.getCart(userId);
    return CartResponseDto.from(cart);
  }

  @Post('items')
  async addItem(
    @CurrentUser() userId: string,
    @Body() dto: AddCartItemDto,
  ): Promise<AddCartItemResponseDto> {
    const cartItemId = await this.cartService.addItem(
      userId,
      dto.skuId,
      dto.quantity,
    );
    return AddCartItemResponseDto.from(cartItemId);
  }

  @Patch('items/:cartItemId')
  @HttpCode(204)
  async changeQuantity(
    @CurrentUser() userId: string,
    @Param('cartItemId', new ParseUUIDPipe({ version: '7' }))
    cartItemId: string,
    @Body() dto: ChangeCartItemQuantityDto,
  ): Promise<void> {
    await this.cartService.changeQuantity(userId, cartItemId, dto.quantity);
  }

  @Delete('items/:cartItemId')
  @HttpCode(204)
  async removeItem(
    @CurrentUser() userId: string,
    @Param('cartItemId', new ParseUUIDPipe({ version: '7' }))
    cartItemId: string,
  ): Promise<void> {
    await this.cartService.removeItem(userId, cartItemId);
  }
}
