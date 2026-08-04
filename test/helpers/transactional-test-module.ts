import {
  ClsPluginTransactional,
  NoOpTransactionalAdapter,
  TransactionHost,
} from '@nestjs-cls/transactional';
import { DynamicModule } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';

export type WithTransactionSpy = jest.SpiedFunction<
  TransactionHost['withTransaction']
>;

export function noOpTransactionalModule(): DynamicModule {
  return ClsModule.forRoot({
    plugins: [
      new ClsPluginTransactional({
        adapter: new NoOpTransactionalAdapter({ tx: {}, disableWarning: true }),
      }),
    ],
  });
}

export function spyOnTransactions(module: TestingModule): WithTransactionSpy {
  return jest.spyOn(module.get(TransactionHost), 'withTransaction');
}
