import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { PaymentStatusTransitionError } from './payment.errors';

export enum PaymentMethod {
  PAY_MONEY = 'PAY_MONEY',
  CARD = 'CARD',
}

export enum PaymentStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

const PAYMENT_EXPIRY_MS = 30 * 60 * 1000;

@Entity('payments')
export class Payment {
  @PrimaryColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('uuid')
  orderId: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column()
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Column({ type: 'datetime', precision: 6 })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static create(params: {
    orderId: string;
    method: PaymentMethod;
    amount: number;
    now: Date;
  }): Payment {
    const payment = new Payment();
    payment.id = uuidv7();
    payment.orderId = params.orderId;
    payment.method = params.method;
    payment.amount = params.amount;
    payment.status = PaymentStatus.REQUESTED;
    payment.expiresAt = new Date(params.now.getTime() + PAYMENT_EXPIRY_MS);
    return payment;
  }

  approve(): void {
    if (this.status !== PaymentStatus.REQUESTED) {
      throw new PaymentStatusTransitionError(this.id, this.status);
    }
    this.status = PaymentStatus.APPROVED;
  }

  fail(): void {
    if (this.status !== PaymentStatus.REQUESTED) {
      throw new PaymentStatusTransitionError(this.id, this.status);
    }
    this.status = PaymentStatus.FAILED;
  }

  cancel(): void {
    if (
      this.status !== PaymentStatus.REQUESTED &&
      this.status !== PaymentStatus.APPROVED
    ) {
      throw new PaymentStatusTransitionError(this.id, this.status);
    }
    this.status = PaymentStatus.CANCELLED;
  }

  isApproved(): boolean {
    return this.status === PaymentStatus.APPROVED;
  }
}
