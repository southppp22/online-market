import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { INestApplication } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { App } from 'supertest/types';
import { ProductRepository } from '../src/modules/product/domain/product.repository';
import { Sku } from '../src/modules/product/domain/sku.entity';
import { createE2eApp, truncateAllTables } from './helpers/e2e-app';
import { seedProduct } from './helpers/e2e-fixtures';

const LOCK_WAIT_TIMEOUT_SECONDS = 3;
const TEST_TIMEOUT_MS = 20000;

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

function deferred(): Deferred {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('SKU 재고 잠금 범위 (e2e)', () => {
  let app: INestApplication<App>;
  let cls: ClsService;
  let txHost: TransactionHost<TransactionalAdapterTypeOrm>;
  let repository: ProductRepository;
  let productId: string;
  let skus: Sku[];

  beforeAll(async () => {
    app = await createE2eApp();
    cls = app.get(ClsService);
    txHost = app.get(TransactionHost);
    repository = app.get(ProductRepository);
  });

  beforeEach(async () => {
    await truncateAllTables(app);
    const seeded = await seedProduct(app, [
      { optionName: '블랙', price: 10000, stock: 10 },
      { optionName: '화이트', price: 10000, stock: 10 },
    ]);
    productId = seeded.product.id;
    skus = seeded.skus;
  });

  afterAll(async () => {
    await app.close();
  });

  function holdLockOn(skuId: string): {
    locked: Promise<void>;
    release: () => void;
    finished: Promise<void>;
  } {
    const acquired = deferred();
    const releasing = deferred();
    const finished = cls.run(() =>
      txHost.withTransaction(async () => {
        await repository.findSkusByIdsForUpdate([skuId]);
        acquired.resolve();
        await releasing.promise;
      }),
    );
    return { locked: acquired.promise, release: releasing.resolve, finished };
  }

  function lockWithTimeout(skuId: string): Promise<string[]> {
    return cls.run(() =>
      txHost.withTransaction(async () => {
        await txHost.tx.query(
          `SET innodb_lock_wait_timeout = ${LOCK_WAIT_TIMEOUT_SECONDS}`,
        );
        const locked = await repository.findSkusByIdsForUpdate([skuId]);
        return locked.map((sku) => sku.id);
      }),
    );
  }

  async function whileHolding<T>(
    skuId: string,
    action: () => Promise<T>,
  ): Promise<T> {
    const holder = holdLockOn(skuId);
    await holder.locked;
    try {
      return await action();
    } finally {
      holder.release();
      await holder.finished;
    }
  }

  it(
    '같은 상품의 다른 SKU는 잠금 대기 없이 잠글 수 있다',
    async () => {
      const other = await whileHolding(skus[0].id, () =>
        lockWithTimeout(skus[1].id),
      );

      expect(other).toEqual([skus[1].id]);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    '같은 SKU를 잠그면 잠금 대기 타임아웃이 난다',
    async () => {
      await whileHolding(skus[0].id, async () => {
        await expect(lockWithTimeout(skus[0].id)).rejects.toThrow(
          /lock wait timeout/i,
        );
      });
    },
    TEST_TIMEOUT_MS,
  );

  it('잠금 조회 결과에 product 관계가 채워진다', async () => {
    const locked = await cls.run(() =>
      txHost.withTransaction(() =>
        repository.findSkusByIdsForUpdate(skus.map((sku) => sku.id)),
      ),
    );

    expect(locked).toHaveLength(2);
    for (const sku of locked) {
      expect(sku.product.id).toBe(productId);
    }
  });
});
