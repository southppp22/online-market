import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { v7 as uuidv7 } from 'uuid';
import { createE2eApp, truncateAllTables } from './helpers/e2e-app';
import {
  chargePayMoney,
  getSkuStock,
  issueCouponTo,
  receiverFixture,
  seedProduct,
  signupAndLogin,
} from './helpers/e2e-fixtures';

interface CartBody {
  items: { id: string; skuId: string; lineAmount: number }[];
  itemsAmount: number;
  shippingFee: number;
  totalAmount: number;
}

interface CreateOrderBody {
  id: string;
  status: string;
  totalAmount: number;
  payment: { id: string; expiresAt: string | null };
}

interface OrderDetailBody {
  id: string;
  status: string;
  items: { productName: string; price: number; quantity: number }[];
  itemsAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
}

interface CouponListBody {
  items: { id: string; isUsed: boolean }[];
}

describe('PAY_MONEY 주문 흐름 (e2e)', () => {
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

  it('장바구니 → 금액 확인 → 쿠폰 주문(즉시 PAID) → 잔액·재고 차감 → 목록/상세 → 취소 복원', async () => {
    const server = app.getHttpServer();
    const { skus } = await seedProduct(app, [
      { optionName: '블랙', price: 20000, stock: 10 },
    ]);
    const skuId = skus[0].id;
    const cookie = await signupAndLogin(app, 'buyer@test.com');
    const userId = await chargePayMoney(app, 'buyer@test.com', 500000);
    const coupon = await issueCouponTo(app, userId);

    await request(server)
      .post('/api/cart/items')
      .set('Cookie', cookie)
      .send({ skuId, quantity: 2 })
      .expect(201);

    const cartRes = await request(server)
      .get('/api/cart')
      .set('Cookie', cookie)
      .expect(200);
    const cart = cartRes.body as CartBody;
    expect(cart.items[0].lineAmount).toBe(40000);
    expect(cart.itemsAmount).toBe(40000);
    expect(cart.shippingFee).toBe(0);
    expect(cart.totalAmount).toBe(40000);

    const couponsRes = await request(server)
      .get('/api/coupons?usable=true')
      .set('Cookie', cookie)
      .expect(200);
    const usableCouponIds = (couponsRes.body as CouponListBody).items.map(
      (item) => item.id,
    );
    expect(usableCouponIds).toContain(coupon.id);

    const orderRes = await request(server)
      .post('/api/orders')
      .set('Cookie', cookie)
      .send({
        idempotencyKey: uuidv7(),
        items: [{ skuId, quantity: 2 }],
        couponId: coupon.id,
        receiver: receiverFixture(),
        payment: { method: 'PAY_MONEY' },
      })
      .expect(201);
    const created = orderRes.body as CreateOrderBody;
    expect(created.status).toBe('PAID');
    expect(created.totalAmount).toBe(37000);
    expect(created.payment.expiresAt).toBeNull();

    const meRes = await request(server)
      .get('/api/users/me')
      .set('Cookie', cookie)
      .expect(200);
    expect((meRes.body as { payMoneyBalance: number }).payMoneyBalance).toBe(
      463000,
    );
    expect(await getSkuStock(app, skuId)).toBe(8);

    const listRes = await request(server)
      .get('/api/orders')
      .set('Cookie', cookie)
      .expect(200);
    const list = listRes.body as { items: { id: string; status: string }[] };
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({ id: created.id, status: 'PAID' });

    const detailRes = await request(server)
      .get(`/api/orders/${created.id}`)
      .set('Cookie', cookie)
      .expect(200);
    const detail = detailRes.body as OrderDetailBody;
    expect(detail.itemsAmount).toBe(40000);
    expect(detail.discountAmount).toBe(3000);
    expect(detail.shippingFee).toBe(0);
    expect(detail.totalAmount).toBe(37000);
    expect(detail.items[0]).toMatchObject({
      productName: '무선 이어폰',
      price: 20000,
      quantity: 2,
    });

    const cancelRes = await request(server)
      .post(`/api/orders/${created.id}/cancel`)
      .set('Cookie', cookie)
      .expect(200);
    expect(cancelRes.body).toEqual({
      refundAmount: 37000,
      order: { id: created.id, status: 'CANCELLED' },
    });

    const meAfterCancel = await request(server)
      .get('/api/users/me')
      .set('Cookie', cookie)
      .expect(200);
    expect(
      (meAfterCancel.body as { payMoneyBalance: number }).payMoneyBalance,
    ).toBe(500000);
    expect(await getSkuStock(app, skuId)).toBe(10);

    const couponsAfterCancel = await request(server)
      .get('/api/coupons?usable=true')
      .set('Cookie', cookie)
      .expect(200);
    const restored = (couponsAfterCancel.body as CouponListBody).items.find(
      (item) => item.id === coupon.id,
    );
    expect(restored).toMatchObject({ id: coupon.id, isUsed: false });
  });
});
