import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { Payment } from '../domain/payment.entity';
import { PaymentRepository } from '../domain/payment.repository';

@Injectable()
export class TypeOrmPaymentRepository extends PaymentRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super();
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.txHost.tx.findOneBy(Payment, {
      orderId,
    });
  }

  async save(payment: Payment): Promise<void> {
    await this.txHost.tx.save(payment);
  }
}
