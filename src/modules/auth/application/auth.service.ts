import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/application/user.service';
import { InvalidCredentialsError } from '../domain/auth.errors';
import { PasswordHasher } from '../domain/password-hasher';
import { SessionStore } from '../domain/session-store';

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  phone: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionStore: SessionStore,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async signup(input: SignupInput): Promise<void> {
    const passwordHash = await this.passwordHasher.hash(input.password);
    await this.userService.createUser({
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
    });
  }

  async login(
    email: string,
    password: string,
    existingSessionId?: string,
  ): Promise<string> {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const passwordMatches = await this.passwordHasher.compare(
      password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (existingSessionId) {
      await this.sessionStore.deleteSession(existingSessionId);
    }
    return this.sessionStore.createSession(user.id);
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionStore.deleteSession(sessionId);
  }
}
