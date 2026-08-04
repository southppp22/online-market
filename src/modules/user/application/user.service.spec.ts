import { Test } from '@nestjs/testing';
import { createTestUser } from '../../../../test/fixtures/user.fixture';
import {
  noOpTransactionalModule,
  spyOnTransactions,
  WithTransactionSpy,
} from '../../../../test/helpers/transactional-test-module';
import {
  DuplicateEmailError,
  InsufficientPayMoneyError,
  UserNotFoundError,
} from '../domain/user.errors';
import { UserRepository } from '../domain/user.repository';
import { UserService } from './user.service';

const userId = '019fb1da-b166-7358-a4f4-1d61ba0be630';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;
  let withTransaction: WithTransactionSpy;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [noOpTransactionalModule()],
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            findByIdForUpdate: jest.fn(),
            findByEmail: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserService);
    repository = module.get(UserRepository);
    withTransaction = spyOnTransactions(module);
  });

  describe('getMe', () => {
    it('사용자가 존재하면 반환한다', async () => {
      const userId = '019fb1da-b166-7358-a4f4-1d61ba0be630';
      const user = createTestUser({ id: userId });
      repository.findById.mockResolvedValue(user);

      const actual = await service.getMe(userId);

      expect(actual).toBe(user);
    });

    it('사용자가 없으면 UserNotFoundError를 던진다', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.getMe('019fb1da-b166-7358-a4f4-1d61ba0be999'),
      ).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('createUser', () => {
    it('이메일이 중복되지 않으면 사용자를 생성한다', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.save.mockResolvedValue(undefined);

      const actual = await service.createUser({
        email: 'a@b.com',
        passwordHash: 'hashed',
        name: '김남인',
        phone: '010-1234-5678',
      });

      expect(actual.email).toBe('a@b.com');
      expect(actual.passwordHash).toBe('hashed');
      expect(repository.save).toHaveBeenCalledWith(actual);
    });

    it('이메일이 중복되면 DuplicateEmailError를 던진다', async () => {
      repository.findByEmail.mockResolvedValue(
        createTestUser({ id: 'existing' }),
      );

      await expect(
        service.createUser({
          email: 'a@b.com',
          passwordHash: 'hashed',
          name: '김남인',
          phone: '010-1234-5678',
        }),
      ).rejects.toThrow(DuplicateEmailError);
    });
  });

  describe('findUserByEmail', () => {
    it('사용자가 존재하면 반환한다', async () => {
      const user = createTestUser({ id: 'user-1', email: 'a@b.com' });
      repository.findByEmail.mockResolvedValue(user);

      const actual = await service.findUserByEmail('a@b.com');

      expect(actual).toBe(user);
    });

    it('사용자가 없으면 null을 반환한다', async () => {
      repository.findByEmail.mockResolvedValue(null);

      const actual = await service.findUserByEmail('none@b.com');

      expect(actual).toBeNull();
    });
  });

  describe('deductPayMoney', () => {
    it('잔액을 락 조회해 차감하고 저장한다', async () => {
      const user = createTestUser({ id: userId, payMoneyBalance: 10000 });
      repository.findByIdForUpdate.mockResolvedValue(user);

      await service.deductPayMoney(userId, 3000);

      expect(repository.findByIdForUpdate).toHaveBeenCalledWith(userId);
      expect(user.payMoneyBalance).toBe(7000);
      expect(repository.save).toHaveBeenCalledWith(user);
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });

    it('사용자가 없으면 UserNotFoundError를 던진다', async () => {
      repository.findByIdForUpdate.mockResolvedValue(null);

      await expect(service.deductPayMoney(userId, 1000)).rejects.toThrow(
        UserNotFoundError,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('잔액이 부족하면 InsufficientPayMoneyError를 전파한다', async () => {
      const user = createTestUser({ id: userId, payMoneyBalance: 1000 });
      repository.findByIdForUpdate.mockResolvedValue(user);

      await expect(service.deductPayMoney(userId, 5000)).rejects.toThrow(
        InsufficientPayMoneyError,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('refundPayMoney', () => {
    it('잔액을 락 조회해 환불하고 저장한다', async () => {
      const user = createTestUser({ id: userId, payMoneyBalance: 1000 });
      repository.findByIdForUpdate.mockResolvedValue(user);

      await service.refundPayMoney(userId, 3000);

      expect(user.payMoneyBalance).toBe(4000);
      expect(repository.save).toHaveBeenCalledWith(user);
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });

    it('사용자가 없으면 UserNotFoundError를 던진다', async () => {
      repository.findByIdForUpdate.mockResolvedValue(null);

      await expect(service.refundPayMoney(userId, 1000)).rejects.toThrow(
        UserNotFoundError,
      );
    });
  });
});
