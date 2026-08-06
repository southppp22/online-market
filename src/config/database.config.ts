import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function databaseConfig(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: config.getOrThrow<string>('DB_HOST'),
    port: config.getOrThrow<number>('DB_PORT'),
    username: config.getOrThrow<string>('DB_USERNAME'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_DATABASE'),
    timezone: 'Z',
    autoLoadEntities: true,
    synchronize: config.get<boolean>('DB_SYNCHRONIZE', false),
    ssl: config.get<boolean>('DB_SSL', false) ? {} : undefined,
    extra: { connectionLimit: 10, queueLimit: 50 },
  };
}
