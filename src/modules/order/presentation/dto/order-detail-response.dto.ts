import { OrderItem } from '../../domain/order-item.entity';
import { Order, OrderStatus } from '../../domain/order.entity';

export class OrderDetailItemResponseDto {
  id: string;
  skuId: string;
  productName: string;
  optionName: string;
  price: number;
  quantity: number;
  lineAmount: number;

  private constructor(item: OrderItem) {
    this.id = item.id;
    this.skuId = item.skuId;
    this.productName = item.productName;
    this.optionName = item.optionName;
    this.price = item.price;
    this.quantity = item.quantity;
    this.lineAmount = item.lineAmount();
  }

  static from(item: OrderItem): OrderDetailItemResponseDto {
    return new OrderDetailItemResponseDto(item);
  }
}

export class OrderDetailResponseDto {
  id: string;
  status: OrderStatus;
  items: OrderDetailItemResponseDto[];
  receiver: {
    name: string;
    address: string;
    phone: string;
    message: string | null;
  };
  itemsAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  orderedAt: Date;

  private constructor(order: Order) {
    this.id = order.id;
    this.status = order.status;
    this.items = order.items.map((item) =>
      OrderDetailItemResponseDto.from(item),
    );
    this.receiver = {
      name: order.receiverName,
      address: order.receiverAddress,
      phone: order.receiverPhone,
      message: order.receiverMessage,
    };
    this.itemsAmount = order.itemsAmount;
    this.discountAmount = order.discountAmount;
    this.shippingFee = order.shippingFee;
    this.totalAmount = order.totalAmount;
    this.orderedAt = order.createdAt;
  }

  static from(order: Order): OrderDetailResponseDto {
    return new OrderDetailResponseDto(order);
  }
}
