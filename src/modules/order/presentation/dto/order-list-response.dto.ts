import { Order, OrderStatus } from '../../domain/order.entity';
import {
  OrderListFilter,
  OrderListResult,
} from '../../domain/order.repository';

export class OrderListItemResponseDto {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  orderedAt: Date;

  private constructor(order: Order) {
    this.id = order.id;
    this.status = order.status;
    this.totalAmount = order.totalAmount;
    this.orderedAt = order.createdAt;
  }

  static from(order: Order): OrderListItemResponseDto {
    return new OrderListItemResponseDto(order);
  }
}

export class OrderListResponseDto {
  items: OrderListItemResponseDto[];
  page: number;
  size: number;
  totalCount: number;

  private constructor(
    result: OrderListResult,
    filter: Pick<OrderListFilter, 'page' | 'size'>,
  ) {
    this.items = result.items.map((order) =>
      OrderListItemResponseDto.from(order),
    );
    this.page = filter.page;
    this.size = filter.size;
    this.totalCount = result.totalCount;
  }

  static from(
    result: OrderListResult,
    filter: Pick<OrderListFilter, 'page' | 'size'>,
  ): OrderListResponseDto {
    return new OrderListResponseDto(result, filter);
  }
}
