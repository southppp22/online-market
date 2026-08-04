import { Order, OrderStatus } from './order.entity';

export interface OrderListFilter {
  status?: OrderStatus;
  page: number;
  size: number;
}

export interface OrderListResult {
  items: Order[];
  totalCount: number;
}

export abstract class OrderRepository {
  abstract findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<Order | null>;
  abstract findWithItemsByIdAndUserId(
    orderId: string,
    userId: string,
  ): Promise<Order | null>;
  abstract findByIdAndUserIdForUpdate(
    orderId: string,
    userId: string,
  ): Promise<Order | null>;
  abstract findPageByUser(
    userId: string,
    filter: OrderListFilter,
  ): Promise<OrderListResult>;
  abstract save(order: Order): Promise<void>;
}
