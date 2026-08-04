import { createTestOrder } from '../../../../test/fixtures/order.fixture';
import {
  createOrderServiceTestContext,
  OrderServiceTestContext,
} from '../../../../test/helpers/order-service-test-module';
import { OrderStatus } from '../domain/order.entity';
import { OrderNotFoundError } from '../domain/order.errors';
import { OrderListFilter } from '../domain/order.repository';

const userId = '019fb1da-b166-7358-a4f4-1d61ba0be630';
const orderId = '019fb1da-b166-7358-a4f4-1d61ba0be640';

describe('OrderService', () => {
  let ctx: OrderServiceTestContext;

  beforeEach(async () => {
    ctx = await createOrderServiceTestContext();
  });

  describe('getOrders', () => {
    it('페이징·필터를 그대로 repository에 위임한다', async () => {
      const filter: OrderListFilter = {
        status: OrderStatus.PAID,
        page: 2,
        size: 10,
      };
      const result = { items: [createTestOrder({ userId })], totalCount: 11 };
      ctx.orderRepository.findPageByUser.mockResolvedValue(result);

      const actual = await ctx.service.getOrders(userId, filter);

      expect(ctx.orderRepository.findPageByUser).toHaveBeenCalledWith(
        userId,
        filter,
      );
      expect(actual).toBe(result);
    });
  });

  describe('getOrderDetail', () => {
    it('items가 로드된 주문을 반환한다', async () => {
      const order = createTestOrder({ id: orderId, userId });
      ctx.orderRepository.findWithItemsByIdAndUserId.mockResolvedValue(order);

      const actual = await ctx.service.getOrderDetail(orderId, userId);

      expect(
        ctx.orderRepository.findWithItemsByIdAndUserId,
      ).toHaveBeenCalledWith(orderId, userId);
      expect(actual).toBe(order);
    });

    it('주문이 없으면 OrderNotFoundError를 던진다', async () => {
      ctx.orderRepository.findWithItemsByIdAndUserId.mockResolvedValue(null);

      await expect(ctx.service.getOrderDetail(orderId, userId)).rejects.toThrow(
        OrderNotFoundError,
      );
    });

    it('타인의 주문이면 같은 OrderNotFoundError를 던진다', async () => {
      const otherUserId = '019fb1da-b166-7358-a4f4-1d61ba0be631';
      ctx.orderRepository.findWithItemsByIdAndUserId.mockResolvedValue(null);

      await expect(
        ctx.service.getOrderDetail(orderId, otherUserId),
      ).rejects.toThrow(OrderNotFoundError);
      expect(
        ctx.orderRepository.findWithItemsByIdAndUserId,
      ).toHaveBeenCalledWith(orderId, otherUserId);
    });
  });
});
