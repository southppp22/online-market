import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SessionStore } from './domain/session-store';
import { RedisSessionStore } from './infrastructure/redis-session.store';
import { SessionAuthGuard } from './presentation/session-auth.guard';

// APP_GUARD는 모듈 트리 어디서 import되든 전역 가드로 동작한다 — 별도 재등록 불필요.
@Module({
  providers: [
    { provide: SessionStore, useClass: RedisSessionStore },
    { provide: APP_GUARD, useClass: SessionAuthGuard },
  ],
  exports: [SessionStore],
})
export class SessionModule {}
