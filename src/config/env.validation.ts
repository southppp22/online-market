import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  DB_SYNCHRONIZE?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  DB_SSL?: boolean;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsInt()
  REDIS_PORT: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  REDIS_TLS?: boolean;

  @IsOptional()
  @IsInt()
  PORT?: number;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    excludeExtraneousValues: false,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(`환경변수 검증 실패:\n${details}`);
  }
  return validated;
}
