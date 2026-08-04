import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { CouponService } from '../../src/modules/coupon/application/coupon.service';
import { Coupon } from '../../src/modules/coupon/domain/coupon.entity';
import { ProductCategory } from '../../src/modules/product/domain/product-category';
import { Product } from '../../src/modules/product/domain/product.entity';
import { Sku } from '../../src/modules/product/domain/sku.entity';
import { UserService } from '../../src/modules/user/application/user.service';

export const TEST_PASSWORD = '12345678';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SeedSkuInput {
  optionName: string;
  price: number;
  stock: number;
}

// 상품 생성 API가 없으므로 도메인 팩토리로 만들어 DataSource로 저장한다.
export async function seedProduct(
  app: INestApplication<App>,
  skuInputs: SeedSkuInput[],
): Promise<{ product: Product; skus: Sku[] }> {
  const product = Product.create({
    name: '무선 이어폰',
    description: 'e2e 테스트 상품',
    basePrice: skuInputs[0].price,
    category: ProductCategory.ELECTRONICS,
  });
  const skus = skuInputs.map((input) =>
    Sku.create(product.id, input.optionName, input.price, input.stock),
  );

  const dataSource = app.get(DataSource);
  await dataSource.getRepository(Product).save(product);
  await dataSource.getRepository(Sku).save(skus);
  return { product, skus };
}

export async function getSkuStock(
  app: INestApplication<App>,
  skuId: string,
): Promise<number> {
  const sku = await app
    .get(DataSource)
    .getRepository(Sku)
    .findOneByOrFail({ id: skuId });
  return sku.stock;
}

export async function signupAndLogin(
  app: INestApplication<App>,
  email: string,
): Promise<string> {
  await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({
      email,
      password: TEST_PASSWORD,
      name: '테스터',
      phone: '01012345678',
      agreements: { termsOfService: true, privacyPolicy: true },
    })
    .expect(201);

  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: TEST_PASSWORD })
    .expect(204);
  const setCookie = loginRes.get('Set-Cookie') ?? [];
  return setCookie[0].split(';')[0];
}

export async function chargePayMoney(
  app: INestApplication<App>,
  email: string,
  amount: number,
): Promise<string> {
  const userService = app.get(UserService);
  const user = await userService.findUserByEmail(email);
  if (!user) {
    throw new Error(`충전 대상 유저가 없습니다. (${email})`);
  }
  await userService.refundPayMoney(user.id, amount);
  return user.id;
}

export async function issueCouponTo(
  app: INestApplication<App>,
  userId: string,
  overrides: { discountAmount?: number; expiresAt?: Date } = {},
): Promise<Coupon> {
  return app.get(CouponService).issueCoupon({
    userId,
    name: 'e2e 테스트 쿠폰',
    discountAmount: overrides.discountAmount ?? 3000,
    minOrderAmount: 30000,
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 30 * DAY_MS),
  });
}

export function expectErrorBody(body: unknown, code: string): void {
  expect(body).toEqual({ code, message: expect.any(String) as string });
}

export function receiverFixture(): {
  name: string;
  address: string;
  phone: string;
} {
  return {
    name: '김남인',
    address: '서울시 강남구 테헤란로 1',
    phone: '01012345678',
  };
}
