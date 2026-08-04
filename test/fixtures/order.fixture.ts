import { OrderItem } from '../../src/modules/order/domain/order-item.entity';
import {
  Order,
  OrderStatus,
} from '../../src/modules/order/domain/order.entity';

export function createTestOrderItem(
  overrides: Partial<OrderItem> = {},
): OrderItem {
  const item = new OrderItem();
  item.id = overrides.id ?? '019fb1da-b166-7358-a4f4-1d61ba0be641';
  item.orderId = overrides.orderId ?? '019fb1da-b166-7358-a4f4-1d61ba0be640';
  item.skuId = overrides.skuId ?? '019fb1da-b166-7358-a4f4-1d61ba0be631';
  item.productName = overrides.productName ?? '무선 이어폰';
  item.optionName = overrides.optionName ?? '블랙';
  item.price = overrides.price ?? 10000;
  item.quantity = overrides.quantity ?? 1;
  return item;
}

export function createTestOrder(overrides: Partial<Order> = {}): Order {
  const order = new Order();
  Object.assign(
    order,
    {
      id: '019fb1da-b166-7358-a4f4-1d61ba0be640',
      userId: '019fb1da-b166-7358-a4f4-1d61ba0be630',
      idempotencyKey: 'idem-key-1',
      status: OrderStatus.PENDING,
      couponId: null,
      itemsAmount: 10000,
      discountAmount: 0,
      shippingFee: 3000,
      totalAmount: 13000,
      receiverName: '김수령',
      receiverAddress: '서울시 강남구 테헤란로 1',
      receiverPhone: '010-1234-5678',
      receiverMessage: null,
      createdAt: new Date('2026-08-04T00:00:00Z'),
    },
    overrides,
  );
  order.items = overrides.items ?? [createTestOrderItem({ orderId: order.id })];
  return order;
}
