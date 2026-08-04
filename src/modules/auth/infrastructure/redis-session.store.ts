import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/redis/redis.module';
import { SESSION_TTL_SECONDS, SessionStore } from '../domain/session-store';

const SESSION_KEY_PREFIX = 'session:';
const SESSION_ID_BYTES = 8;

@Injectable()
export class RedisSessionStore extends SessionStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    super();
  }

  async createSession(userId: string): Promise<string> {
    const sessionId = randomBytes(SESSION_ID_BYTES).toString('hex');
    await this.redis.set(
      this.key(sessionId),
      userId,
      'EX',
      SESSION_TTL_SECONDS,
    );
    return sessionId;
  }

  async findUserId(sessionId: string): Promise<string | null> {
    return this.redis.get(this.key(sessionId));
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  private key(sessionId: string): string {
    return `${SESSION_KEY_PREFIX}${sessionId}`;
  }
}
