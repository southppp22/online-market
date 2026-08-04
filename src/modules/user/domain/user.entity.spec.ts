import { createTestUser } from '../../../../test/fixtures/user.fixture';
import { User } from './user.entity';
import {
  InsufficientPayMoneyError,
  InvalidPayMoneyAmountError,
} from './user.errors';

function createUser(balance: number): User {
  return createTestUser({ payMoneyBalance: balance });
}

describe('User', () => {
  describe('create', () => {
    it('필드가 모두 설정되고 잔액 0원과 id가 할당된 상태로 생성된다', () => {
      const user = User.create('a@b.com', 'hashed', '김남인', '010-1234-5678');

      expect(user.id).toEqual(expect.any(String));
      expect(user.email).toBe('a@b.com');
      expect(user.passwordHash).toBe('hashed');
      expect(user.name).toBe('김남인');
      expect(user.phone).toBe('010-1234-5678');
      expect(user.payMoneyBalance).toBe(0);
    });
  });

  describe('deductPayMoney', () => {
    it('잔액 범위 내 금액이면 차감한다', () => {
      const user = createUser(10000);

      user.deductPayMoney(3000);

      expect(user.payMoneyBalance).toBe(7000);
    });

    it('잔액보다 많은 금액이면 InsufficientPayMoneyError를 던진다', () => {
      const user = createUser(1000);

      expect(() => user.deductPayMoney(2000)).toThrow(
        InsufficientPayMoneyError,
      );
    });

    it('음수 금액이면 InvalidPayMoneyAmountError를 던진다', () => {
      const user = createUser(10000);

      expect(() => user.deductPayMoney(-1000)).toThrow(
        InvalidPayMoneyAmountError,
      );
    });

    it('0원이면 InvalidPayMoneyAmountError를 던진다', () => {
      const user = createUser(10000);

      expect(() => user.deductPayMoney(0)).toThrow(InvalidPayMoneyAmountError);
    });

    it('소수 금액이면 InvalidPayMoneyAmountError를 던진다', () => {
      const user = createUser(10000);

      expect(() => user.deductPayMoney(100.5)).toThrow(
        InvalidPayMoneyAmountError,
      );
    });
  });

  describe('refundPayMoney', () => {
    it('양의 정수 금액이면 잔액에 더한다', () => {
      const user = createUser(1000);

      user.refundPayMoney(500);

      expect(user.payMoneyBalance).toBe(1500);
    });

    it('음수 금액이면 InvalidPayMoneyAmountError를 던진다', () => {
      const user = createUser(1000);

      expect(() => user.refundPayMoney(-500)).toThrow(
        InvalidPayMoneyAmountError,
      );
    });

    it('0원이면 InvalidPayMoneyAmountError를 던진다', () => {
      const user = createUser(1000);

      expect(() => user.refundPayMoney(0)).toThrow(InvalidPayMoneyAmountError);
    });

    it('소수 금액이면 InvalidPayMoneyAmountError를 던진다', () => {
      const user = createUser(1000);

      expect(() => user.refundPayMoney(100.5)).toThrow(
        InvalidPayMoneyAmountError,
      );
    });
  });
});
