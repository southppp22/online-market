import { ConfigService } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  tls?: Record<string, never>;
}

export function redisConfig(config: ConfigService): RedisConfig {
  return {
    host: config.getOrThrow<string>('REDIS_HOST'),
    port: config.getOrThrow<number>('REDIS_PORT'),
    password: config.get<string>('REDIS_PASSWORD'),
    tls: config.get<boolean>('REDIS_TLS', false) ? {} : undefined,
  };
}
