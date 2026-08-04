import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { DuplicateEmailError, UserNotFoundError } from '../domain/user.errors';
import { UserRepository } from '../domain/user.repository';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
}

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getMe(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new DuplicateEmailError(input.email);
    }

    const user = User.create(
      input.email,
      input.passwordHash,
      input.name,
      input.phone,
    );
    await this.userRepository.save(user);
    return user;
  }

  @Transactional()
  async deductPayMoney(userId: string, amount: number): Promise<void> {
    const user = await this.userRepository.findByIdForUpdate(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    user.deductPayMoney(amount);
    await this.userRepository.save(user);
  }

  @Transactional()
  async refundPayMoney(userId: string, amount: number): Promise<void> {
    const user = await this.userRepository.findByIdForUpdate(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    user.refundPayMoney(amount);
    await this.userRepository.save(user);
  }
}
