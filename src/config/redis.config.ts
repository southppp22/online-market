import { ConfigService } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  tls?: Record<string, never>;
}

export function redisConfig(config: ConfigService): RedisConfig {
  return {
    host: config.getOrThrow<string>('REDIS_HOST'),
    port: config.getOrThrow<number>('REDIS_PORT'),
    tls: config.get<boolean>('REDIS_TLS', false) ? {} : undefined,
  };
}
