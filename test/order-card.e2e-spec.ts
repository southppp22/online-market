import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { v7 as uuidv7 } from 'uuid';
import { createE2eApp, truncateAllTables } from './helpers/e2e-app';
import {
  getSkuStock,
  receiverFixture,
  seedProduct,
  signupAndLogin,
} from './helpers/e2e-fixtures';

interface CreateOrderBody {
  id: string;
  status: string;
  totalAmount: number;
  payment: { id: string; expiresAt: string | null };
}

describe('CARD 주문 흐름 (e2e)', () => {
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

  it('CARD 주문은 PENDING + payment(id, expiresAt)로 응답하고 재고를 차감한다', async () => {
    const server = app.getHttpServer();
    const { skus } = await seedProduct(app, [
      { optionName: '블랙', price: 20000, stock: 10 },
    ]);
    const cookie = await signupAndLogin(app, 'card-buyer@test.com');

    const orderRes = await request(server)
      .post('/api/orders')
      .set('Cookie', cookie)
      .send({
        idempotencyKey: uuidv7(),
        items: [{ skuId: skus[0].id, quantity: 1 }],
        receiver: receiverFixture(),
        payment: { method: 'CARD' },
      })
      .expect(201);
    const created = orderRes.body as CreateOrderBody;

    expect(created.status).toBe('PENDING');
    expect(created.totalAmount).toBe(23000);
    expect(created.payment.id).toEqual(expect.any(String));
    expect(created.payment.expiresAt).not.toBeNull();
    expect(await getSkuStock(app, skus[0].id)).toBe(9);
  });

  it('같은 멱등성 키 재요청은 새 주문 없이 동일 주문·payment id를 반환한다', async () => {
    const server = app.getHttpServer();
    const { skus } = await seedProduct(app, [
      { optionName: '블랙', price: 20000, stock: 10 },
    ]);
    const cookie = await signupAndLogin(app, 'card-retry@test.com');
    const orderBody = {
      idempotencyKey: uuidv7(),
      items: [{ skuId: skus[0].id, quantity: 1 }],
      receiver: receiverFixture(),
      payment: { method: 'CARD' },
    };

    const firstRes = await request(server)
      .post('/api/orders')
      .set('Cookie', cookie)
      .send(orderBody)
      .expect(201);
    const first = firstRes.body as CreateOrderBody;

    const retryRes = await request(server)
      .post('/api/orders')
      .set('Cookie', cookie)
      .send(orderBody)
      .expect(201);
    const retry = retryRes.body as CreateOrderBody;

    expect(retry.id).toBe(first.id);
    expect(retry.status).toBe('PENDING');
    expect(retry.payment.id).toBe(first.payment.id);
    expect(await getSkuStock(app, skus[0].id)).toBe(9);
  });
});
