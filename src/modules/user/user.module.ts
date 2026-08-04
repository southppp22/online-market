import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './application/user.service';
import { User } from './domain/user.entity';
import { UserRepository } from './domain/user.repository';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository';
import { UserController } from './presentation/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [
    UserService,
    { provide: UserRepository, useClass: TypeOrmUserRepository },
  ],
  exports: [UserService],
})
export class UserModule {}
