import 'reflect-metadata';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/application/auth.service';
import {
  CouponService,
  IssueCouponInput,
} from '../src/modules/coupon/application/coupon.service';
import { Product } from '../src/modules/product/domain/product.entity';
import { Sku } from '../src/modules/product/domain/sku.entity';
import { UserService } from '../src/modules/user/application/user.service';
import { SEED_PRODUCTS, SeedProductDefinition } from './seed-products';

const TEST_USER = {
  email: 'a@b.com',
  password: '12345678',
  name: '김남인',
  phone: '01012345678',
};
const TEST_USER_PAY_MONEY = 500000;

const DAY_MS = 24 * 60 * 60 * 1000;

function buildSeedCoupons(userId: string): IssueCouponInput[] {
  return [
    {
      userId,
      name: '3,000원 할인',
      discountAmount: 3000,
      minOrderAmount: 30000,
      expiresAt: new Date(Date.now() + 60 * DAY_MS),
    },
    {
      userId,
      name: '만료된 5,000원 할인',
      discountAmount: 5000,
      minOrderAmount: 10000,
      expiresAt: new Date(Date.now() - DAY_MS),
    },
    {
      userId,
      name: '10,000원 할인 (100만원 이상 구매 시)',
      discountAmount: 10000,
      minOrderAmount: 1000000,
      expiresAt: new Date(Date.now() + 60 * DAY_MS),
    },
  ];
}

async function seedTestUser(app: INestApplicationContext): Promise<string> {
  const userService = app.get(UserService);

  const existing = await userService.findUserByEmail(TEST_USER.email);
  if (existing) {
    console.log(`테스트 유저가 이미 있어 건너뜁니다. (${TEST_USER.email})`);
    return existing.id;
  }

  await app.get(AuthService).signup(TEST_USER);
  const created = await userService.findUserByEmail(TEST_USER.email);
  if (!created) {
    throw new Error('테스트 유저 생성에 실패했습니다.');
  }
  await userService.refundPayMoney(created.id, TEST_USER_PAY_MONEY);
  console.log(
    `테스트 유저를 생성했습니다. (${TEST_USER.email}, 페이머니 ${TEST_USER_PAY_MONEY}원)`,
  );
  return created.id;
}

async function seedCoupons(
  app: INestApplicationContext,
  userId: string,
): Promise<void> {
  const couponService = app.get(CouponService);

  const existingCoupons = await couponService.getMyCoupons(userId);
  if (existingCoupons.length > 0) {
    console.log(
      `이미 시딩된 쿠폰이 ${existingCoupons.length}건 있어 건너뜁니다.`,
    );
    return;
  }

  for (const input of buildSeedCoupons(userId)) {
    await couponService.issueCoupon(input);
  }
  console.log(`쿠폰 3종을 시딩했습니다. (userId: ${userId})`);
}

async function seedProducts(dataSource: DataSource): Promise<void> {
  for (const definition of SEED_PRODUCTS) {
    const exists = await dataSource
      .getRepository(Product)
      .findOneBy({ name: definition.name });
    if (exists) {
      console.log(`상품이 이미 있어 건너뜁니다. (${definition.name})`);
      continue;
    }
    await saveSeedProduct(dataSource, definition);
  }
}

async function saveSeedProduct(
  dataSource: DataSource,
  definition: SeedProductDefinition,
): Promise<void> {
  const product = Product.create({
    name: definition.name,
    description: definition.description,
    basePrice: definition.basePrice,
    category: definition.category,
    isRecommended: definition.isRecommended,
  });
  if (definition.isDeleted) {
    product.delete(new Date());
  }
  const skus = definition.skus.map((sku) =>
    Sku.create(product.id, sku.optionName, sku.price, sku.stock),
  );

  await dataSource.getRepository(Product).save(product);
  await dataSource.getRepository(Sku).save(skus);
  console.log(
    `상품을 시딩했습니다. (${definition.name}, SKU ${skus.length}개)`,
  );
}

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const userId = await seedTestUser(app);
    await seedCoupons(app, userId);
    await seedProducts(app.get(DataSource));
  } finally {
    await app.close();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
