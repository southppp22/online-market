import { User } from '../../src/modules/user/domain/user.entity';

export function createTestUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = overrides.id ?? '019fb1da-b166-7358-a4f4-1d61ba0be630';
  user.email = overrides.email ?? 'a@b.com';
  user.passwordHash = overrides.passwordHash ?? 'hashed';
  user.name = overrides.name ?? '김남인';
  user.phone = overrides.phone ?? '010-1234-5678';
  user.payMoneyBalance = overrides.payMoneyBalance ?? 0;
  return user;
}
