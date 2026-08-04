import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponModule } from '../coupon/coupon.module';
import { PaymentModule } from '../payment/payment.module';
import { ProductModule } from '../product/product.module';
import { OrderService } from './application/order.service';
import { OrderItem } from './domain/order-item.entity';
import { Order } from './domain/order.entity';
import { OrderRepository } from './domain/order.repository';
import { TypeOrmOrderRepository } from './infrastructure/typeorm-order.repository';
import { OrderController } from './presentation/order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    PaymentModule,
    ProductModule,
    CouponModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    { provide: OrderRepository, useClass: TypeOrmOrderRepository },
  ],
})
export class OrderModule {}
