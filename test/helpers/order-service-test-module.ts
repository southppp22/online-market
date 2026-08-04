import { Test } from '@nestjs/testing';
import { CouponService } from '../../src/modules/coupon/application/coupon.service';
import { OrderService } from '../../src/modules/order/application/order.service';
import { OrderRepository } from '../../src/modules/order/domain/order.repository';
import { PaymentService } from '../../src/modules/payment/application/payment.service';
import { ProductService } from '../../src/modules/product/application/product.service';
import {
  noOpTransactionalModule,
  spyOnTransactions,
  WithTransactionSpy,
} from './transactional-test-module';

export interface OrderServiceTestContext {
  service: OrderService;
  orderRepository: jest.Mocked<OrderRepository>;
  paymentService: jest.Mocked<PaymentService>;
  productService: jest.Mocked<ProductService>;
  couponService: jest.Mocked<CouponService>;
  withTransaction: WithTransactionSpy;
}

export async function createOrderServiceTestContext(): Promise<OrderServiceTestContext> {
  const module = await Test.createTestingModule({
    imports: [noOpTransactionalModule()],
    providers: [
      OrderService,
      {
        provide: OrderRepository,
        useValue: {
          findByIdempotencyKey: jest.fn(),
          findWithItemsByIdAndUserId: jest.fn(),
          findByIdAndUserIdForUpdate: jest.fn(),
          findPageByUser: jest.fn(),
          save: jest.fn(),
        },
      },
      {
        provide: PaymentService,
        useValue: {
          getPaymentByOrderId: jest.fn(),
          createPayment: jest.fn(),
          payByPaymoney: jest.fn(),
          failPayment: jest.fn(),
          cancelPayment: jest.fn(),
        },
      },
      {
        provide: ProductService,
        useValue: {
          findSkusWithProduct: jest.fn(),
          deductStocks: jest.fn(),
          restoreStocks: jest.fn(),
        },
      },
      {
        provide: CouponService,
        useValue: {
          getCoupon: jest.fn(),
          useCoupon: jest.fn(),
          cancelCouponUse: jest.fn(),
        },
      },
    ],
  }).compile();

  return {
    service: module.get(OrderService),
    orderRepository: module.get(OrderRepository),
    paymentService: module.get(PaymentService),
    productService: module.get(ProductService),
    couponService: module.get(CouponService),
    withTransaction: spyOnTransactions(module),
  };
}
