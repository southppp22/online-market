import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';

export async function createE2eApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();
  return app;
}

export async function truncateAllTables(
  app: INestApplication<App>,
): Promise<void> {
  const dataSource = app.get(DataSource);
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const metadata of dataSource.entityMetadatas) {
    await dataSource.query(`TRUNCATE TABLE \`${metadata.tableName}\``);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}
