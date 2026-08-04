import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/application/user.service';
import { Payment, PaymentMethod } from '../domain/payment.entity';
import { PaymentNotFoundError } from '../domain/payment.errors';
import { PaymentRepository } from '../domain/payment.repository';

export interface CreatePaymentInput {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  now: Date;
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly userService: UserService,
  ) {}

  async getPaymentByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new PaymentNotFoundError(orderId);
    }
    return payment;
  }

  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const payment = Payment.create(input);
    await this.paymentRepository.save(payment);
    return payment;
  }

  @Transactional()
  async payByPaymoney(orderId: string, userId: string): Promise<void> {
    const payment = await this.getPaymentByOrderId(orderId);
    payment.approve();
    await this.paymentRepository.save(payment);
    await this.userService.deductPayMoney(userId, payment.amount);
  }

  async failPayment(orderId: string): Promise<void> {
    const payment = await this.getPaymentByOrderId(orderId);
    payment.fail();
    await this.paymentRepository.save(payment);
  }

  @Transactional()
  async cancelPayment(orderId: string, userId: string): Promise<number> {
    const payment = await this.getPaymentByOrderId(orderId);
    const refundAmount = payment.isApproved() ? payment.amount : 0;
    payment.cancel();
    await this.paymentRepository.save(payment);
    if (refundAmount > 0) {
      await this.userService.refundPayMoney(userId, refundAmount);
    }
    return refundAmount;
  }
}
