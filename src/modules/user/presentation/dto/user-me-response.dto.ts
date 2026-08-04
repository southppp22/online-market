import { User } from '../../domain/user.entity';

export class UserMeResponseDto {
  id: string;
  email: string;
  name: string;
  payMoneyBalance: number;

  private constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.payMoneyBalance = user.payMoneyBalance;
  }

  static from(user: User): UserMeResponseDto {
    return new UserMeResponseDto(user);
  }
}
