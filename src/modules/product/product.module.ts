import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './application/product.service';
import { Product } from './domain/product.entity';
import { ProductRepository } from './domain/product.repository';
import { Sku } from './domain/sku.entity';
import { TypeOrmProductRepository } from './infrastructure/typeorm-product.repository';
import { ProductController } from './presentation/product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Sku])],
  controllers: [ProductController],
  providers: [
    ProductService,
    { provide: ProductRepository, useClass: TypeOrmProductRepository },
  ],
  exports: [ProductService],
})
export class ProductModule {}
