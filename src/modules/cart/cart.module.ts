import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from '../product/product.module';
import { CartService } from './application/cart.service';
import { CartItem } from './domain/cart-item.entity';
import { CartRepository } from './domain/cart.repository';
import { TypeOrmCartRepository } from './infrastructure/typeorm-cart.repository';
import { CartController } from './presentation/cart.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem]), ProductModule],
  controllers: [CartController],
  providers: [
    CartService,
    { provide: CartRepository, useClass: TypeOrmCartRepository },
  ],
})
export class CartModule {}
