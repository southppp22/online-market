import { Test } from '@nestjs/testing';
import { createTestPayment } from '../../../../test/fixtures/payment.fixture';
import {
  noOpTransactionalModule,
  spyOnTransactions,
  WithTransactionSpy,
} from '../../../../test/helpers/transactional-test-module';
import { UserService } from '../../user/application/user.service';
import { PaymentMethod, PaymentStatus } from '../domain/payment.entity';
import { PaymentNotFoundError } from '../domain/payment.errors';
import { PaymentRepository } from '../domain/payment.repository';
import { PaymentService } from './payment.service';

const orderId = '019fb1da-b166-7358-a4f4-1d61ba0be640';
const userId = '019fb1da-b166-7358-a4f4-1d61ba0be630';

describe('PaymentService', () => {
  let service: PaymentService;
  let repository: jest.Mocked<PaymentRepository>;
  let userService: jest.Mocked<UserService>;
  let withTransaction: WithTransactionSpy;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [noOpTransactionalModule()],
      providers: [
        PaymentService,
        {
          provide: PaymentRepository,
          useValue: {
            findByOrderId: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: { deductPayMoney: jest.fn(), refundPayMoney: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(PaymentService);
    repository = module.get(PaymentRepository);
    userService = module.get(UserService);
    withTransaction = spyOnTransactions(module);
  });

  describe('getPaymentByOrderId', () => {
    it('결제가 존재하면 반환한다', async () => {
      const payment = createTestPayment({ orderId });
      repository.findByOrderId.mockResolvedValue(payment);

      const actual = await service.getPaymentByOrderId(orderId);

      expect(repository.findByOrderId).toHaveBeenCalledWith(orderId);
      expect(actual).toBe(payment);
    });

    it('결제가 없으면 PaymentNotFoundError를 던진다', async () => {
      repository.findByOrderId.mockResolvedValue(null);

      await expect(service.getPaymentByOrderId(orderId)).rejects.toThrow(
        PaymentNotFoundError,
      );
    });
  });

  describe('createPayment', () => {
    it('REQUESTED 상태의 결제를 생성·저장하고 반환한다', async () => {
      const now = new Date('2026-08-04T00:00:00Z');

      const payment = await service.createPayment({
        orderId,
        method: PaymentMethod.CARD,
        amount: 37000,
        now,
      });

      expect(repository.save).toHaveBeenCalledWith(payment);
      expect(payment.orderId).toBe(orderId);
      expect(payment.method).toBe(PaymentMethod.CARD);
      expect(payment.amount).toBe(37000);
      expect(payment.status).toBe(PaymentStatus.REQUESTED);
      expect(payment.expiresAt).toEqual(new Date('2026-08-04T00:30:00Z'));
    });
  });

  describe('payByPaymoney', () => {
    it('APPROVED 저장과 함께 잔액을 차감한다', async () => {
      const payment = createTestPayment({
        orderId,
        method: PaymentMethod.PAY_MONEY,
        amount: 13000,
      });
      repository.findByOrderId.mockResolvedValue(payment);

      await service.payByPaymoney(orderId, userId);

      expect(payment.status).toBe(PaymentStatus.APPROVED);
      expect(repository.save).toHaveBeenCalledWith(payment);
      expect(userService.deductPayMoney).toHaveBeenCalledWith(userId, 13000);
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('failPayment', () => {
    it('결제를 FAILED로 전이해 저장한다', async () => {
      const payment = createTestPayment({ orderId });
      repository.findByOrderId.mockResolvedValue(payment);

      await service.failPayment(orderId);

      expect(payment.status).toBe(PaymentStatus.FAILED);
      expect(repository.save).toHaveBeenCalledWith(payment);
    });
  });

  describe('cancelPayment', () => {
    it('APPROVED 결제를 취소하면 잔액을 환불하고 환불액을 반환한다', async () => {
      const payment = createTestPayment({
        orderId,
        status: PaymentStatus.APPROVED,
        amount: 13000,
      });
      repository.findByOrderId.mockResolvedValue(payment);

      const refundAmount = await service.cancelPayment(orderId, userId);

      expect(payment.status).toBe(PaymentStatus.CANCELLED);
      expect(repository.save).toHaveBeenCalledWith(payment);
      expect(userService.refundPayMoney).toHaveBeenCalledWith(userId, 13000);
      expect(refundAmount).toBe(13000);
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });

    it('REQUESTED 결제를 취소하면 환불 없이 0을 반환한다', async () => {
      const payment = createTestPayment({
        orderId,
        status: PaymentStatus.REQUESTED,
      });
      repository.findByOrderId.mockResolvedValue(payment);

      const refundAmount = await service.cancelPayment(orderId, userId);

      expect(payment.status).toBe(PaymentStatus.CANCELLED);
      expect(userService.refundPayMoney).not.toHaveBeenCalled();
      expect(refundAmount).toBe(0);
    });

    it('FAILED 결제의 취소는 전이 에러를 던지고 환불하지 않는다', async () => {
      const payment = createTestPayment({
        orderId,
        status: PaymentStatus.FAILED,
      });
      repository.findByOrderId.mockResolvedValue(payment);

      await expect(service.cancelPayment(orderId, userId)).rejects.toThrow();

      expect(repository.save).not.toHaveBeenCalled();
      expect(userService.refundPayMoney).not.toHaveBeenCalled();
    });
  });
});
