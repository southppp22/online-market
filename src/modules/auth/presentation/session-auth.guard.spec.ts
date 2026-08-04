import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UnauthenticatedError } from '../domain/auth.errors';
import { SessionStore } from '../domain/session-store';
import { AuthenticatedRequest, SessionAuthGuard } from './session-auth.guard';

describe('SessionAuthGuard', () => {
  let guard: SessionAuthGuard;
  let sessionStore: jest.Mocked<SessionStore>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    sessionStore = {
      createSession: jest.fn(),
      findUserId: jest.fn(),
      deleteSession: jest.fn(),
    };
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new SessionAuthGuard(sessionStore, reflector);
  });

  function contextWithRequest(request: Partial<AuthenticatedRequest>) {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('@Public 라우트는 세션 확인 없이 통과한다', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = contextWithRequest({});

    const actual = await guard.canActivate(context);

    expect(actual).toBe(true);
    expect(sessionStore.findUserId).not.toHaveBeenCalled();
  });

  it('sid 쿠키가 없으면 UnauthenticatedError를 던진다', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = contextWithRequest({ cookies: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthenticatedError,
    );
  });

  it('세션이 존재하지 않으면 UnauthenticatedError를 던진다', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    sessionStore.findUserId.mockResolvedValue(null);
    const context = contextWithRequest({ cookies: { sid: 'invalid' } });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthenticatedError,
    );
  });

  it('세션이 유효하면 request에 userId를 부착하고 통과한다', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    sessionStore.findUserId.mockResolvedValue('user-1');
    const request: Partial<AuthenticatedRequest> = {
      cookies: { sid: 'valid' },
    };
    const context = contextWithRequest(request);

    const actual = await guard.canActivate(context);

    expect(actual).toBe(true);
    expect(request.userId).toBe('user-1');
  });
});
