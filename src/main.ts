import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestTimeoutInterceptor } from './common/interceptors/request-timeout.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const config = app.get(ConfigService);
  app.useGlobalInterceptors(
    new RequestTimeoutInterceptor(
      config.get<number>('REQUEST_TIMEOUT_MS', 5000),
    ),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(config.get<number>('PORT', 3000));
}
void bootstrap();
