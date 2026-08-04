import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { PaymentService } from './application/payment.service';
import { Payment } from './domain/payment.entity';
import { PaymentRepository } from './domain/payment.repository';
import { TypeOrmPaymentRepository } from './infrastructure/typeorm-payment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), UserModule],
  providers: [
    PaymentService,
    { provide: PaymentRepository, useClass: TypeOrmPaymentRepository },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
