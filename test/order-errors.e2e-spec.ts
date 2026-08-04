import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { v7 as uuidv7 } from 'uuid';
import { createE2eApp, truncateAllTables } from './helpers/e2e-app';
import {
  chargePayMoney,
  expectErrorBody,
  getSkuStock,
  issueCouponTo,
  receiverFixture,
  seedProduct,
  signupAndLogin,
} from './helpers/e2e-fixtures';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('주문 에러 케이스 (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  beforeEach(async () => {
    await truncateAllTables(app);
  });

  afterAll(async () => {
    await app.close();
  });

  function orderBody(
    skuId: string,
    quantity: number,
    couponId?: string,
  ): Record<string, unknown> {
    return {
      idempotencyKey: uuidv7(),
      items: [{ skuId, quantity }],
      couponId,
      receiver: receiverFixture(),
      payment: { method: 'PAY_MONEY' },
    };
  }

  it('재고 초과 주문은 409이고 재고를 차감하지 않는다', async () => {
    const server = app.getHttpServer();
    const { skus } = await seedProduct(app, [
      { optionName: '블랙', price: 20000, stock: 3 },
    ]);
    const cookie = await signupAndLogin(app, 'stock-over@test.com');
    await chargePayMoney(app, 'stock-over@test.com', 500000);

    const res = await request(server)
      .post('/api/orders')
      .set('Cookie', cookie)
      .send(orderBody(skus[0].id, 5))
      .expect(409);

    expectErrorBody(res.body, 'INSUFFICIENT_STOCK');
    expect(await getSkuStock(app, skus[0].id)).toBe(3);
  });

  it('타인의 주문 상세 조회는 404다', async () => {
    const server = app.getHttpServer();
    const { skus } = await seedProduct(app, [
      { optionName: '블랙', price: 20000, stock: 10 },
    ]);
    const ownerCookie = await signupAndLogin(app, 'owner@test.com');
    await chargePayMoney(app, 'owner@test.com', 500000);

    const orderRes = await request(server)
      .post('/api/orders')
      .set('Cookie', ownerCookie)
      .send(orderBody(skus[0].id, 1))
      .expect(201);
    const orderId = (orderRes.body as { id: string }).id;

    const strangerCookie = await signupAndLogin(app, 'stranger@test.com');
    const res = await request(server)
      .get(`/api/orders/${orderId}`)
      .set('Cookie', strangerCookie)
      .expect(404);

    expectErrorBody(res.body, 'ORDER_NOT_FOUND');
  });

  it('만료된 쿠폰 주문은 409이고 재고를 차감하지 않는다', async () => {
    const server = app.getHttpServer();
    const { skus } = await seedProduct(app, [
      { optionName: '블랙', price: 20000, stock: 10 },
    ]);
    const cookie = await signupAndLogin(app, 'expired-coupon@test.com');
    const userId = await chargePayMoney(app, 'expired-coupon@test.com', 500000);
    const expiredCoupon = await issueCouponTo(app, userId, {
      expiresAt: new Date(Date.now() - DAY_MS),
    });

    const res = await request(server)
      .post('/api/orders')
      .set('Cookie', cookie)
      .send(orderBody(skus[0].id, 2, expiredCoupon.id))
      .expect(409);

    expectErrorBody(res.body, 'COUPON_EXPIRED');
    expect(await getSkuStock(app, skus[0].id)).toBe(10);
  });

  it('이미 사용된 쿠폰 주문은 409다', async () => {
    const server = app.getHttpServer();
    const { skus } = await seedProduct(app, [
      { optionName: '블랙', price: 20000, stock: 10 },
    ]);
    const cookie = await signupAndLogin(app, 'used-coupon@test.com');
    const userId = await chargePayMoney(app, 'used-coupon@test.com', 500000);
    const coupon = await issueCouponTo(app, userId);

    await request(server)
      .post('/api/orders')
      .set('Cookie', cookie)
      .send(orderBody(skus[0].id, 2, coupon.id))
      .expect(201);

    const res = await request(server)
      .post('/api/orders')
      .set('Cookie', cookie)
      .send(orderBody(skus[0].id, 2, coupon.id))
      .expect(409);

    expectErrorBody(res.body, 'COUPON_ALREADY_USED');
  });
});
