import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { OrderAmounts } from './order-amounts';
import { OrderItem } from './order-item.entity';
import {
  EmptyOrderItemsError,
  OrderCannotBeCancelledError,
  OrderStatusTransitionError,
} from './order.errors';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface OrderReceiver {
  name: string;
  address: string;
  phone: string;
  message: string | null;
}

const ORDER_EXPIRY_MS = 30 * 60 * 1000;

@Entity('orders')
@Index(['userId', 'idempotencyKey'], { unique: true })
export class Order {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column()
  idempotencyKey: string;

  @Index()
  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @Column({ type: 'uuid', nullable: true })
  couponId: string | null;

  @Column()
  itemsAmount: number;

  @Column()
  discountAmount: number;

  @Column()
  shippingFee: number;

  @Column()
  totalAmount: number;

  @Column()
  receiverName: string;

  @Column()
  receiverAddress: string;

  @Column()
  receiverPhone: string;

  @Column({ type: 'varchar', nullable: true })
  receiverMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item: OrderItem) => item.order, {
    cascade: ['insert'],
  })
  items: OrderItem[];

  static create(params: {
    userId: string;
    idempotencyKey: string;
    couponId: string | null;
    items: OrderItem[];
    amounts: OrderAmounts;
    receiver: OrderReceiver;
  }): Order {
    if (params.items.length === 0) {
      throw new EmptyOrderItemsError();
    }
    const order = new Order();
    order.id = uuidv7();
    order.userId = params.userId;
    order.idempotencyKey = params.idempotencyKey;
    order.status = OrderStatus.PENDING;
    order.couponId = params.couponId;
    order.itemsAmount = params.amounts.itemsAmount;
    order.discountAmount = params.amounts.discountAmount;
    order.shippingFee = params.amounts.shippingFee;
    order.totalAmount = params.amounts.totalAmount;
    order.receiverName = params.receiver.name;
    order.receiverAddress = params.receiver.address;
    order.receiverPhone = params.receiver.phone;
    order.receiverMessage = params.receiver.message;
    order.items = params.items;
    return order;
  }

  pay(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new OrderStatusTransitionError(this.id, this.status, 'pay');
    }
    this.status = OrderStatus.PAID;
  }

  fail(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new OrderStatusTransitionError(this.id, this.status, 'fail');
    }
    this.status = OrderStatus.FAILED;
  }

  cancel(): void {
    if (
      this.status !== OrderStatus.PENDING &&
      this.status !== OrderStatus.PAID
    ) {
      throw new OrderCannotBeCancelledError(this.id, this.status);
    }
    this.status = OrderStatus.CANCELLED;
  }

  startShipping(): void {
    if (this.status !== OrderStatus.PAID) {
      throw new OrderStatusTransitionError(
        this.id,
        this.status,
        'startShipping',
      );
    }
    this.status = OrderStatus.SHIPPING;
  }

  completeDelivery(): void {
    if (this.status !== OrderStatus.SHIPPING) {
      throw new OrderStatusTransitionError(
        this.id,
        this.status,
        'completeDelivery',
      );
    }
    this.status = OrderStatus.DELIVERED;
  }

  expire(now: Date): void {
    if (!this.isExpired(now)) {
      throw new OrderStatusTransitionError(this.id, this.status, 'expire');
    }
    this.status = OrderStatus.FAILED;
  }

  isExpired(now: Date): boolean {
    if (this.status !== OrderStatus.PENDING) {
      return false;
    }
    return now.getTime() - this.createdAt.getTime() >= ORDER_EXPIRY_MS;
  }
}
