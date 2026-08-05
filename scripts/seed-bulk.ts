import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource, Like } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { AppModule } from '../src/app.module';
import { PasswordHasher } from '../src/modules/auth/domain/password-hasher';
import { ProductCategory } from '../src/modules/product/domain/product-category';
import { Product } from '../src/modules/product/domain/product.entity';
import { User } from '../src/modules/user/domain/user.entity';

const PRODUCT_COUNT = Number(process.env.PRODUCT_COUNT ?? 1_000_000);
const USER_COUNT = Number(process.env.USER_COUNT ?? 10_000);
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 1_000);
const PROGRESS_INTERVAL = 50_000;

const LOADTEST_EMAIL_DOMAIN = '@loadtest.local';
const LOADTEST_PASSWORD = '12345678';
const USER_PAY_MONEY = 1_000_000;

const TIMESALE_PRODUCT_NAME = '타임세일 한정판 특가';
const TIMESALE_PRICE = 100;
const TIMESALE_STOCK = 1_000_000;

const KEYWORDS = [
  '프리미엄',
  '무선',
  '유기농',
  '이어폰',
  '키보드',
  '충전기',
  '퓨어',
  '한정판',
];
const NOUNS = [
  '헤드셋',
  '텀블러',
  '파우치',
  '스탠드',
  '케이스',
  '슬리퍼',
  '머그',
  '블렌더',
];
const CATEGORIES = [
  ProductCategory.ELECTRONICS,
  ProductCategory.BEAUTY,
  ProductCategory.FRESH_FOOD,
];

const CREATED_AT_SPAN_MS = 365 * 24 * 60 * 60 * 1000;
const CREATED_AT_START = Date.now() - CREATED_AT_SPAN_MS;

const PRODUCT_INSERT =
  'INSERT INTO products (id, name, description, basePrice, category, isRecommended, createdAt, deletedAt) VALUES ';
const SKU_INSERT =
  'INSERT INTO skus (id, productId, optionName, price, stock) VALUES ';
const USER_INSERT =
  'INSERT IGNORE INTO users (id, email, passwordHash, name, phone, payMoneyBalance) VALUES ';

interface GeneratedProduct {
  productValues: unknown[];
  skuValues: unknown[][];
}

// 인덱스만으로 값이 정해져야 중단 후 이어받기(resume)에서 같은 데이터가 나온다.
function noise(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function generateSkus(
  productId: string,
  index: number,
  basePrice: number,
): unknown[][] {
  const skuCount = 1 + Math.floor(noise(index, 2) * 3);
  return Array.from({ length: skuCount }, (_, offset) => {
    const stockNoise = noise(index * 10 + offset, 3);
    return [
      uuidv7(),
      productId,
      `옵션 ${offset + 1}`,
      basePrice + offset * 1000,
      stockNoise < 0.01 ? 0 : 10 + Math.floor(stockNoise * 1000),
    ];
  });
}

function generateProduct(index: number): GeneratedProduct {
  const id = uuidv7();
  const keyword = KEYWORDS[index % KEYWORDS.length];
  const noun = NOUNS[Math.floor(index / KEYWORDS.length) % NOUNS.length];
  const basePrice = 1000 + Math.floor(noise(index, 1) * 499_000);
  const createdAt = new Date(
    CREATED_AT_START + Math.floor((index / PRODUCT_COUNT) * CREATED_AT_SPAN_MS),
  );
  return {
    productValues: [
      id,
      `${keyword} ${noun} #${index}`,
      `부하 테스트용 더미 상품 ${index}번입니다.`,
      basePrice,
      CATEGORIES[index % CATEGORIES.length],
      noise(index, 5) < 0.01,
      createdAt,
      noise(index, 4) < 0.01 ? createdAt : null,
    ],
    skuValues: generateSkus(id, index, basePrice),
  };
}

function generateUser(index: number, passwordHash: string): unknown[] {
  const sequence = String(index + 1).padStart(5, '0');
  return [
    uuidv7(),
    `user${sequence}${LOADTEST_EMAIL_DOMAIN}`,
    passwordHash,
    `부하테스트유저${sequence}`,
    `010${sequence}000`,
    USER_PAY_MONEY,
  ];
}

async function insertRows(
  dataSource: DataSource,
  prefix: string,
  rows: unknown[][],
): Promise<void> {
  if (rows.length === 0) {
    return;
  }
  const placeholder = `(${rows[0].map(() => '?').join(', ')})`;
  const values = rows.map(() => placeholder).join(', ');
  await dataSource.query(prefix + values, rows.flat());
}

async function seedUsers(
  dataSource: DataSource,
  hasher: PasswordHasher,
): Promise<void> {
  const existing = await dataSource
    .getRepository(User)
    .countBy({ email: Like(`%${LOADTEST_EMAIL_DOMAIN}`) });
  if (existing >= USER_COUNT) {
    console.log(
      `부하 테스트 유저가 이미 ${existing}명 있어 건너뜁니다. (목표 ${USER_COUNT}명)`,
    );
    return;
  }

  const passwordHash = await hasher.hash(LOADTEST_PASSWORD);
  for (let from = existing; from < USER_COUNT; from += BATCH_SIZE) {
    const to = Math.min(from + BATCH_SIZE, USER_COUNT);
    const rows = Array.from({ length: to - from }, (_, offset) =>
      generateUser(from + offset, passwordHash),
    );
    await insertRows(dataSource, USER_INSERT, rows);
    console.log(`유저 ${to}/${USER_COUNT}명 생성`);
  }
}

async function seedProducts(dataSource: DataSource): Promise<void> {
  // 이름 패턴이 아니라 전체 개수로 판정해야 다른 경로로 들어온 대량 데이터를 중복 생성하지 않는다.
  const existing = await dataSource.getRepository(Product).count();
  if (existing >= PRODUCT_COUNT) {
    console.log(
      `상품이 이미 ${existing}건 있어 건너뜁니다. (목표 ${PRODUCT_COUNT}건)`,
    );
    return;
  }

  for (let from = existing; from < PRODUCT_COUNT; from += BATCH_SIZE) {
    const to = Math.min(from + BATCH_SIZE, PRODUCT_COUNT);
    const generated = Array.from({ length: to - from }, (_, offset) =>
      generateProduct(from + offset),
    );
    await insertRows(
      dataSource,
      PRODUCT_INSERT,
      generated.map((item) => item.productValues),
    );
    await insertRows(
      dataSource,
      SKU_INSERT,
      generated.flatMap((item) => item.skuValues),
    );
    if (to % PROGRESS_INTERVAL === 0 || to === PRODUCT_COUNT) {
      console.log(`상품 ${to}/${PRODUCT_COUNT}건 생성`);
    }
  }
}

async function seedTimesaleProduct(dataSource: DataSource): Promise<void> {
  const existing = await dataSource
    .getRepository(Product)
    .existsBy({ name: TIMESALE_PRODUCT_NAME });
  if (existing) {
    console.log(
      `타임세일 상품이 이미 있어 건너뜁니다. (${TIMESALE_PRODUCT_NAME})`,
    );
    return;
  }

  const id = uuidv7();
  await insertRows(dataSource, PRODUCT_INSERT, [
    [
      id,
      TIMESALE_PRODUCT_NAME,
      '부하 테스트 타임세일 시나리오 전용 상품입니다.',
      TIMESALE_PRICE,
      ProductCategory.ELECTRONICS,
      true,
      new Date(),
      null,
    ],
  ]);
  await insertRows(dataSource, SKU_INSERT, [
    [uuidv7(), id, '단일 옵션', TIMESALE_PRICE, TIMESALE_STOCK],
  ]);
  console.log(
    `타임세일 상품을 생성했습니다. (${TIMESALE_PRODUCT_NAME}, ${TIMESALE_PRICE}원, 재고 ${TIMESALE_STOCK})`,
  );
}

async function seedBulk(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const dataSource = app.get(DataSource);
    await seedUsers(dataSource, app.get(PasswordHasher));
    await seedProducts(dataSource);
    await seedTimesaleProduct(dataSource);
  } finally {
    await app.close();
  }
}

seedBulk()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
