import { Test } from '@nestjs/testing';
import { createTestUser } from '../../../../test/fixtures/user.fixture';
import { UserService } from '../../user/application/user.service';
import { InvalidCredentialsError } from '../domain/auth.errors';
import { PasswordHasher } from '../domain/password-hasher';
import { SessionStore } from '../domain/session-store';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let sessionStore: jest.Mocked<SessionStore>;
  let passwordHasher: jest.Mocked<PasswordHasher>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: { createUser: jest.fn(), findUserByEmail: jest.fn() },
        },
        {
          provide: SessionStore,
          useValue: {
            createSession: jest.fn(),
            findUserId: jest.fn(),
            deleteSession: jest.fn(),
          },
        },
        {
          provide: PasswordHasher,
          useValue: { hash: jest.fn(), compare: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    userService = module.get(UserService);
    sessionStore = module.get(SessionStore);
    passwordHasher = module.get(PasswordHasher);
  });

  describe('signup', () => {
    it('비밀번호를 해싱한 뒤 UserService.createUser를 호출한다', async () => {
      passwordHasher.hash.mockResolvedValue('hashed');
      userService.createUser.mockResolvedValue(createTestUser());

      await service.signup({
        email: 'a@b.com',
        password: 'plain-pw',
        name: '김남인',
        phone: '01012345678',
      });

      expect(passwordHasher.hash).toHaveBeenCalledWith('plain-pw');
      expect(userService.createUser).toHaveBeenCalledWith({
        email: 'a@b.com',
        passwordHash: 'hashed',
        name: '김남인',
        phone: '01012345678',
      });
    });
  });

  describe('login', () => {
    const user = createTestUser({ id: 'user-1', passwordHash: 'hashed' });

    it('자격 증명이 일치하면 세션을 발급한다', async () => {
      userService.findUserByEmail.mockResolvedValue(user);
      passwordHasher.compare.mockResolvedValue(true);
      sessionStore.createSession.mockResolvedValue('new-session-id');

      const actual = await service.login('a@b.com', 'plain-pw');

      expect(actual).toBe('new-session-id');
      expect(sessionStore.deleteSession).not.toHaveBeenCalled();
      expect(sessionStore.createSession).toHaveBeenCalledWith('user-1');
    });

    it('기존 세션이 있으면 삭제 후 새 세션을 발급한다', async () => {
      userService.findUserByEmail.mockResolvedValue(user);
      passwordHasher.compare.mockResolvedValue(true);
      sessionStore.createSession.mockResolvedValue('new-session-id');

      await service.login('a@b.com', 'plain-pw', 'old-session-id');

      expect(sessionStore.deleteSession).toHaveBeenCalledWith('old-session-id');
    });

    it('이메일이 존재하지 않으면 InvalidCredentialsError를 던진다', async () => {
      userService.findUserByEmail.mockResolvedValue(null);

      await expect(service.login('none@b.com', 'plain-pw')).rejects.toThrow(
        InvalidCredentialsError,
      );
    });

    it('비밀번호가 일치하지 않으면 InvalidCredentialsError를 던진다', async () => {
      userService.findUserByEmail.mockResolvedValue(user);
      passwordHasher.compare.mockResolvedValue(false);

      await expect(service.login('a@b.com', 'wrong-pw')).rejects.toThrow(
        InvalidCredentialsError,
      );
    });
  });

  describe('logout', () => {
    it('세션을 삭제한다', async () => {
      await service.logout('session-id');

      expect(sessionStore.deleteSession).toHaveBeenCalledWith('session-id');
    });
  });
});
