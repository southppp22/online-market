import { Test } from '@nestjs/testing';
import {
  createTestProduct,
  createTestSku,
} from '../../../../test/fixtures/product.fixture';
import {
  noOpTransactionalModule,
  spyOnTransactions,
  WithTransactionSpy,
} from '../../../../test/helpers/transactional-test-module';
import { ProductNotFoundError } from '../domain/product.errors';
import {
  ProductListFilter,
  ProductRepository,
} from '../domain/product.repository';
import { InsufficientStockError, SkuNotFoundError } from '../domain/sku.errors';
import { ProductService } from './product.service';

const skuId = '019fb1da-b166-7358-a4f4-1d61ba0be631';

describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<ProductRepository>;
  let withTransaction: WithTransactionSpy;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [noOpTransactionalModule()],
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: {
            findMany: jest.fn(),
            findRecommended: jest.fn(),
            findByIdWithSkus: jest.fn(),
            findSkusByIdsForUpdate: jest.fn(),
            findSkusWithProductByIds: jest.fn(),
            saveSkus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProductService);
    repository = module.get(ProductRepository);
    withTransaction = spyOnTransactions(module);
  });

  describe('listProducts', () => {
    it('전달받은 필터 그대로 repository에 위임한다', async () => {
      const filter: ProductListFilter = { sort: 'latest', page: 1, size: 20 };
      const result = [];
      repository.findMany.mockResolvedValue(result);

      const actual = await service.listProducts(filter);

      expect(repository.findMany).toHaveBeenCalledWith(filter);
      expect(actual).toBe(result);
    });
  });

  describe('listRecommendedProducts', () => {
    it('전달받은 size 그대로 repository에 위임한다', async () => {
      const items = [];
      repository.findRecommended.mockResolvedValue(items);

      const actual = await service.listRecommendedProducts(20);

      expect(repository.findRecommended).toHaveBeenCalledWith(20);
      expect(actual).toBe(items);
    });
  });

  describe('getProductDetail', () => {
    it('상품이 존재하면 상세 정보를 반환한다', async () => {
      const productId = '019fb1da-b166-7358-a4f4-1d61ba0be630';
      const product = createTestProduct({ id: productId });
      repository.findByIdWithSkus.mockResolvedValue(product);

      const actual = await service.getProductDetail(productId);

      expect(actual).toBe(product);
    });

    it('상품이 없거나 삭제되었으면 ProductNotFoundError를 던진다', async () => {
      repository.findByIdWithSkus.mockResolvedValue(null);

      await expect(
        service.getProductDetail('019fb1da-b166-7358-a4f4-1d61ba0be999'),
      ).rejects.toThrow(ProductNotFoundError);
    });
  });

  describe('deductStocks', () => {
    it('락으로 조회한 SKU의 재고를 차감하고 저장한다', async () => {
      const sku = createTestSku({ id: skuId, stock: 10 });
      repository.findSkusByIdsForUpdate.mockResolvedValue([sku]);

      await service.deductStocks([{ skuId, quantity: 3 }]);

      expect(repository.findSkusByIdsForUpdate).toHaveBeenCalledWith([skuId]);
      expect(sku.stock).toBe(7);
      expect(repository.saveSkus).toHaveBeenCalledWith([sku]);
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });

    it('SKU가 일부 존재하지 않으면 SkuNotFoundError를 던진다', async () => {
      repository.findSkusByIdsForUpdate.mockResolvedValue([]);

      await expect(
        service.deductStocks([{ skuId, quantity: 1 }]),
      ).rejects.toThrow(SkuNotFoundError);
      expect(repository.saveSkus).not.toHaveBeenCalled();
    });

    it('삭제된 상품의 SKU면 SkuNotFoundError를 던진다', async () => {
      const sku = createTestSku({
        id: skuId,
        product: createTestProduct({ deletedAt: new Date() }),
      });
      repository.findSkusByIdsForUpdate.mockResolvedValue([sku]);

      await expect(
        service.deductStocks([{ skuId, quantity: 1 }]),
      ).rejects.toThrow(SkuNotFoundError);
      expect(repository.saveSkus).not.toHaveBeenCalled();
    });

    it('재고가 부족하면 InsufficientStockError를 전파한다', async () => {
      const sku = createTestSku({ id: skuId, stock: 1 });
      repository.findSkusByIdsForUpdate.mockResolvedValue([sku]);

      await expect(
        service.deductStocks([{ skuId, quantity: 5 }]),
      ).rejects.toThrow(InsufficientStockError);
      expect(repository.saveSkus).not.toHaveBeenCalled();
    });
  });

  describe('restoreStocks', () => {
    it('락으로 조회한 SKU의 재고를 복원하고 저장한다', async () => {
      const sku = createTestSku({ id: skuId, stock: 5 });
      repository.findSkusByIdsForUpdate.mockResolvedValue([sku]);

      await service.restoreStocks([{ skuId, quantity: 3 }]);

      expect(sku.stock).toBe(8);
      expect(repository.saveSkus).toHaveBeenCalledWith([sku]);
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });

    it('삭제된 상품의 SKU여도 재고를 복원한다', async () => {
      const sku = createTestSku({
        id: skuId,
        stock: 5,
        product: createTestProduct({ deletedAt: new Date() }),
      });
      repository.findSkusByIdsForUpdate.mockResolvedValue([sku]);

      await service.restoreStocks([{ skuId, quantity: 3 }]);

      expect(sku.stock).toBe(8);
      expect(repository.saveSkus).toHaveBeenCalledWith([sku]);
    });

    it('SKU가 일부 존재하지 않으면 SkuNotFoundError를 던진다', async () => {
      repository.findSkusByIdsForUpdate.mockResolvedValue([]);

      await expect(
        service.restoreStocks([{ skuId, quantity: 1 }]),
      ).rejects.toThrow(SkuNotFoundError);
      expect(repository.saveSkus).not.toHaveBeenCalled();
    });
  });
});
