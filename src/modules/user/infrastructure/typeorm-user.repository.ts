import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';

@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    return this.txHost.tx.findOneBy(User, { id });
  }

  async findByIdForUpdate(id: string): Promise<User | null> {
    return this.txHost.tx
      .createQueryBuilder(User, 'user')
      .where('user.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.txHost.tx.findOneBy(User, {
      email,
    });
  }

  async save(user: User): Promise<void> {
    await this.txHost.tx.save(user);
  }
}
