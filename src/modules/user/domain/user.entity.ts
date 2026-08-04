import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import {
  InsufficientPayMoneyError,
  InvalidPayMoneyAmountError,
} from './user.errors';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ default: 0 })
  payMoneyBalance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static create(
    email: string,
    passwordHash: string,
    name: string,
    phone: string,
  ): User {
    const user = new User();
    user.id = uuidv7();
    user.email = email;
    user.passwordHash = passwordHash;
    user.name = name;
    user.phone = phone;
    user.payMoneyBalance = 0;
    return user;
  }

  deductPayMoney(amount: number): void {
    this.validatePositiveInteger(amount);
    if (this.payMoneyBalance < amount) {
      throw new InsufficientPayMoneyError(this.id);
    }
    this.payMoneyBalance -= amount;
  }

  refundPayMoney(amount: number): void {
    this.validatePositiveInteger(amount);
    this.payMoneyBalance += amount;
  }

  private validatePositiveInteger(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new InvalidPayMoneyAmountError(amount);
    }
  }
}
