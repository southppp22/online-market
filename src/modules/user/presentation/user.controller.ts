import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { UserService } from '../application/user.service';
import { UserMeResponseDto } from './dto/user-me-response.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@CurrentUser() userId: string): Promise<UserMeResponseDto> {
    const user = await this.userService.getMe(userId);
    return UserMeResponseDto.from(user);
  }
}
