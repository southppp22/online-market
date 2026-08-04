import { ConfigService } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
}

export function redisConfig(config: ConfigService): RedisConfig {
  return {
    host: config.getOrThrow<string>('REDIS_HOST'),
    port: config.getOrThrow<number>('REDIS_PORT'),
  };
}
