import { Test } from '@nestjs/testing';
import { createTestCoupon } from '../../../../test/fixtures/coupon.fixture';
import {
  noOpTransactionalModule,
  spyOnTransactions,
  WithTransactionSpy,
} from '../../../../test/helpers/transactional-test-module';
import {
  CouponMinOrderAmountError,
  CouponNotFoundError,
} from '../domain/coupon.errors';
import { CouponRepository } from '../domain/coupon.repository';
import { CouponService } from './coupon.service';

describe('CouponService', () => {
  let service: CouponService;
  let repository: jest.Mocked<CouponRepository>;
  let withTransaction: WithTransactionSpy;

  const userId = '019fb1da-b166-7358-a4f4-1d61ba0be630';
  const couponId = '019fb1da-b166-7358-a4f4-1d61ba0be631';
  const orderId = '019fb1da-b166-7358-a4f4-1d61ba0be640';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [noOpTransactionalModule()],
      providers: [
        CouponService,
        {
          provide: CouponRepository,
          useValue: {
            findByUser: jest.fn(),
            findByIdAndUserId: jest.fn(),
            findByIdAndUserIdForUpdate: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CouponService);
    repository = module.get(CouponRepository);
    withTransaction = spyOnTransactions(module);
  });

  describe('getMyCoupons', () => {
    it('보유한 쿠폰 전체를 조회한다', async () => {
      const coupons = [createTestCoupon({ id: couponId })];
      repository.findByUser.mockResolvedValue(coupons);

      const actual = await service.getMyCoupons(userId);

      expect(actual).toBe(coupons);
      expect(repository.findByUser).toHaveBeenCalledWith(
        userId,
        {},
        expect.any(Date),
      );
    });
  });

  describe('getMyUsableCoupons', () => {
    it('사용 가능한 쿠폰만 조회한다', async () => {
      repository.findByUser.mockResolvedValue([]);

      await service.getMyUsableCoupons(userId);

      expect(repository.findByUser).toHaveBeenCalledWith(
        userId,
        { usable: true },
        expect.any(Date),
      );
    });
  });

  describe('getCoupon', () => {
    it('쿠폰이 존재하면 반환한다', async () => {
      const coupon = createTestCoupon({ id: couponId });
      repository.findByIdAndUserId.mockResolvedValue(coupon);

      const actual = await service.getCoupon(couponId, userId);

      expect(actual).toBe(coupon);
    });

    it('쿠폰이 없으면 CouponNotFoundError를 던진다', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.getCoupon(couponId, userId)).rejects.toThrow(
        CouponNotFoundError,
      );
    });
  });

  describe('useCoupon', () => {
    it('사용 가능한 쿠폰을 락 조회해 사용 처리하고 저장한다', async () => {
      const coupon = createTestCoupon({ id: couponId, minOrderAmount: 10000 });
      repository.findByIdAndUserIdForUpdate.mockResolvedValue(coupon);

      await service.useCoupon({
        couponId,
        userId,
        orderAmount: 20000,
        orderId,
      });

      expect(repository.findByIdAndUserIdForUpdate).toHaveBeenCalledWith(
        couponId,
        userId,
      );
      expect(coupon.isUsed()).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(coupon);
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });

    it('쿠폰이 없으면 CouponNotFoundError를 던진다', async () => {
      repository.findByIdAndUserIdForUpdate.mockResolvedValue(null);

      await expect(
        service.useCoupon({ couponId, userId, orderAmount: 20000, orderId }),
      ).rejects.toThrow(CouponNotFoundError);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('최소 주문 금액을 충족하지 않으면 CouponMinOrderAmountError를 전파한다', async () => {
      const coupon = createTestCoupon({ id: couponId, minOrderAmount: 30000 });
      repository.findByIdAndUserIdForUpdate.mockResolvedValue(coupon);

      await expect(
        service.useCoupon({ couponId, userId, orderAmount: 10000, orderId }),
      ).rejects.toThrow(CouponMinOrderAmountError);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('cancelCouponUse', () => {
    it('사용한 쿠폰을 락 조회해 사용 취소하고 저장한다', async () => {
      const coupon = createTestCoupon({
        id: couponId,
        usedAt: new Date(),
        usedOrderId: orderId,
      });
      repository.findByIdAndUserIdForUpdate.mockResolvedValue(coupon);

      await service.cancelCouponUse(couponId, userId, orderId);

      expect(coupon.isUsed()).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(coupon);
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });

    it('쿠폰이 없으면 CouponNotFoundError를 던진다', async () => {
      repository.findByIdAndUserIdForUpdate.mockResolvedValue(null);

      await expect(
        service.cancelCouponUse(couponId, userId, orderId),
      ).rejects.toThrow(CouponNotFoundError);
    });
  });

  describe('issueCoupon', () => {
    it('쿠폰을 생성해 repository.save를 호출하고 반환한다', async () => {
      repository.save.mockResolvedValue(undefined);

      const actual = await service.issueCoupon({
        userId,
        name: '3,000원 할인',
        discountAmount: 3000,
        minOrderAmount: 30000,
        expiresAt: new Date('2026-12-31'),
      });

      expect(actual.userId).toBe(userId);
      expect(actual.name).toBe('3,000원 할인');
      expect(repository.save).toHaveBeenCalledWith(actual);
    });
  });
});
