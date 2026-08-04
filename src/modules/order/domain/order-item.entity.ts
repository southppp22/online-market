import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  orderId: string;

  @ManyToOne(() => Order, (order: Order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column('uuid')
  skuId: string;

  @Column()
  productName: string;

  @Column()
  optionName: string;

  @Column()
  price: number;

  @Column()
  quantity: number;

  static create(params: {
    skuId: string;
    productName: string;
    optionName: string;
    price: number;
    quantity: number;
  }): OrderItem {
    const item = new OrderItem();
    item.id = uuidv7();
    item.skuId = params.skuId;
    item.productName = params.productName;
    item.optionName = params.optionName;
    item.price = params.price;
    item.quantity = params.quantity;
    return item;
  }

  lineAmount(): number {
    return this.price * this.quantity;
  }
}
