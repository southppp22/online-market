import {
  CallHandler,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { delay, firstValueFrom, of, throwError } from 'rxjs';
import { RequestTimeoutInterceptor } from './request-timeout.interceptor';

describe('RequestTimeoutInterceptor', () => {
  const interceptor = new RequestTimeoutInterceptor(50);
  const context = {} as ExecutionContext;

  function handlerOf(source: CallHandler['handle']): CallHandler {
    return { handle: source } as CallHandler;
  }

  it('상한 안에 끝난 응답은 그대로 통과시킨다', async () => {
    const next = handlerOf(() => of('결과').pipe(delay(10)));

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).resolves.toBe('결과');
  });

  it('상한을 넘긴 응답은 503으로 끊는다', async () => {
    const next = handlerOf(() => of('결과').pipe(delay(200)));

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('타임아웃이 아닌 에러는 변형하지 않는다', async () => {
    const original = new Error('핸들러 자체 실패');
    const next = handlerOf(() => throwError(() => original));

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBe(original);
  });
});
