import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthService } from '../application/auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SID_COOKIE, sessionCookieOptions } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('signup')
  @HttpCode(201)
  async signup(@Body() dto: SignupDto): Promise<void> {
    await this.authService.signup({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      phone: dto.phone,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(204)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const existingSessionId = req.cookies?.[SID_COOKIE] as string | undefined;
    const sessionId = await this.authService.login(
      dto.email,
      dto.password,
      existingSessionId,
    );
    res.cookie(SID_COOKIE, sessionId, this.cookieOptions());
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId = req.cookies[SID_COOKIE] as string;
    await this.authService.logout(sessionId);
    res.clearCookie(SID_COOKIE, this.cookieOptions());
  }

  private cookieOptions() {
    return sessionCookieOptions(this.configService.get<string>('NODE_ENV'));
  }
}
