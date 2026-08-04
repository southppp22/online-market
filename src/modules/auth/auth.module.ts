import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './application/auth.service';
import { PasswordHasher } from './domain/password-hasher';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { AuthController } from './presentation/auth.controller';
import { SessionModule } from './session.module';

@Module({
  imports: [UserModule, SessionModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
  ],
})
export class AuthModule {}
