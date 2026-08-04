import { Test } from '@nestjs/testing';
import { createTestCartItem } from '../../../../test/fixtures/cart.fixture';
import {
  noOpTransactionalModule,
  spyOnTransactions,
  WithTransactionSpy,
} from '../../../../test/helpers/transactional-test-module';
import {
  createTestProduct,
  createTestSku,
} from '../../../../test/fixtures/product.fixture';
import { ProductService } from '../../product/application/product.service';
import { Sku } from '../../product/domain/sku.entity';
import { SkuNotFoundError } from '../../product/domain/sku.errors';
import { CartItem } from '../domain/cart-item.entity';
import {
  CartItemNotFoundError,
  DuplicateCartItemError,
} from '../domain/cart.errors';
import { CartRepository } from '../domain/cart.repository';
import { CartService } from './cart.service';

const userId = '019fb1da-b166-7358-a4f4-1d61ba0be630';
const skuId = '019fb1da-b166-7358-a4f4-1d61ba0be631';
const cartItemId = '019fb1da-b166-7358-a4f4-1d61ba0be632';

function createSku(
  overrides: Partial<Sku> & { deletedAt?: Date | null } = {},
): Sku {
  const { deletedAt, ...skuOverrides } = overrides;
  return createTestSku({
    id: skuId,
    ...skuOverrides,
    product: createTestProduct({ deletedAt: deletedAt ?? null }),
  });
}

function createCartItem(quantity: number): CartItem {
  return createTestCartItem({ id: cartItemId, userId, skuId, quantity });
}

describe('CartService', () => {
  let service: CartService;
  let cartRepository: jest.Mocked<CartRepository>;
  let productService: jest.Mocked<ProductService>;
  let withTransaction: WithTransactionSpy;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [noOpTransactionalModule()],
      providers: [
        CartService,
        {
          provide: CartRepository,
          useValue: {
            findByUser: jest.fn(),
            findByUserAndSkuForUpdate: jest.fn(),
            findByIdAndUserId: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: ProductService,
          useValue: {
            findSkusWithProduct: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CartService);
    cartRepository = module.get(CartRepository);
    productService = module.get(ProductService);
    withTransaction = spyOnTransactions(module);
  });

  describe('getCart', () => {
    it('장바구니 항목과 SKU 정보를 조합해 금액을 계산한다', async () => {
      cartRepository.findByUser.mockResolvedValue([createCartItem(2)]);
      productService.findSkusWithProduct.mockResolvedValue([createSku()]);

      const actual = await service.getCart(userId);

      expect(actual.items).toEqual([
        {
          id: cartItemId,
          skuId,
          productName: '무선 이어폰',
          optionName: '블랙',
          price: 10000,
          quantity: 2,
          lineAmount: 20000,
          isSoldOut: false,
        },
      ]);
      expect(actual.itemsAmount).toBe(20000);
      expect(actual.shippingFee).toBe(3000);
      expect(actual.totalAmount).toBe(23000);
    });

    it('재고가 0인 SKU는 isSoldOut을 true로 표시한다', async () => {
      cartRepository.findByUser.mockResolvedValue([createCartItem(1)]);
      productService.findSkusWithProduct.mockResolvedValue([
        createSku({ stock: 0 }),
      ]);

      const actual = await service.getCart(userId);

      expect(actual.items[0].isSoldOut).toBe(true);
    });

    it('상품이 소프트 삭제되었으면 isSoldOut을 true로 표시한다', async () => {
      cartRepository.findByUser.mockResolvedValue([createCartItem(1)]);
      productService.findSkusWithProduct.mockResolvedValue([
        createSku({ deletedAt: new Date() }),
      ]);

      const actual = await service.getCart(userId);

      expect(actual.items[0].isSoldOut).toBe(true);
    });

    it('SKU가 조회되지 않는 항목은 응답에서 제외한다', async () => {
      cartRepository.findByUser.mockResolvedValue([createCartItem(1)]);
      productService.findSkusWithProduct.mockResolvedValue([]);

      const actual = await service.getCart(userId);

      expect(actual.items).toEqual([]);
      expect(actual.totalAmount).toBe(0);
    });
  });

  describe('addItem', () => {
    it('SKU가 존재하지 않으면 SkuNotFoundError를 던진다', async () => {
      productService.findSkusWithProduct.mockResolvedValue([]);

      await expect(service.addItem(userId, skuId, 2)).rejects.toThrow(
        SkuNotFoundError,
      );
    });

    it('품절된 SKU도 담을 수 있다', async () => {
      productService.findSkusWithProduct.mockResolvedValue([
        createSku({ stock: 0 }),
      ]);
      cartRepository.findByUserAndSkuForUpdate.mockResolvedValue(null);

      await service.addItem(userId, skuId, 2);

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId, skuId, quantity: 2 }),
      );
    });

    it('소프트 삭제된 상품의 SKU는 SkuNotFoundError를 던진다', async () => {
      productService.findSkusWithProduct.mockResolvedValue([
        createSku({ deletedAt: new Date() }),
      ]);

      await expect(service.addItem(userId, skuId, 2)).rejects.toThrow(
        SkuNotFoundError,
      );
    });

    it('기존 항목이 없으면 새 항목을 만들어 저장하고 id를 반환한다', async () => {
      productService.findSkusWithProduct.mockResolvedValue([createSku()]);
      cartRepository.findByUserAndSkuForUpdate.mockResolvedValue(null);

      const actual = await service.addItem(userId, skuId, 2);

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId, skuId, quantity: 2 }),
      );
      const [savedItem] = cartRepository.save.mock.calls[0];
      expect(actual).toBe(savedItem.id);
      expect(savedItem.id).toEqual(expect.any(String));
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });

    it('기존 항목이 있으면 수량을 합산해 저장하고 기존 id를 반환한다', async () => {
      productService.findSkusWithProduct.mockResolvedValue([createSku()]);
      cartRepository.findByUserAndSkuForUpdate.mockResolvedValue(
        createCartItem(3),
      );

      const actual = await service.addItem(userId, skuId, 2);

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5 }),
      );
      expect(actual).toBe(cartItemId);
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });

    it('동시 신규 담기로 unique 위반이 나면 재조회해 수량을 합산한다', async () => {
      productService.findSkusWithProduct.mockResolvedValue([createSku()]);
      cartRepository.findByUserAndSkuForUpdate
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createCartItem(3));
      cartRepository.save.mockRejectedValueOnce(
        new DuplicateCartItemError(skuId),
      );

      const actual = await service.addItem(userId, skuId, 2);

      expect(cartRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ quantity: 5 }),
      );
      expect(actual).toBe(cartItemId);
      expect(withTransaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('changeQuantity', () => {
    it('타인의 항목이면 CartItemNotFoundError를 던진다', async () => {
      cartRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.changeQuantity(userId, cartItemId, 3),
      ).rejects.toThrow(CartItemNotFoundError);
    });

    it('본인 항목이면 수량을 변경해 저장한다', async () => {
      cartRepository.findByIdAndUserId.mockResolvedValue(createCartItem(1));

      await service.changeQuantity(userId, cartItemId, 3);

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 3 }),
      );
    });
  });

  describe('removeItem', () => {
    it('타인의 항목이면 CartItemNotFoundError를 던진다', async () => {
      cartRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.removeItem(userId, cartItemId)).rejects.toThrow(
        CartItemNotFoundError,
      );
    });

    it('본인 항목이면 삭제한다', async () => {
      const cartItem = createCartItem(1);
      cartRepository.findByIdAndUserId.mockResolvedValue(cartItem);

      await service.removeItem(userId, cartItemId);

      expect(cartRepository.remove).toHaveBeenCalledWith(cartItem);
    });
  });
});
