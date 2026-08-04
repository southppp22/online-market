import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { UnauthenticatedError } from '../domain/auth.errors';
import { SessionStore } from '../domain/session-store';
import { SID_COOKIE } from './session-cookie';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessionStore: SessionStore,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionId = request.cookies?.[SID_COOKIE] as string | undefined;
    if (!sessionId) {
      throw new UnauthenticatedError();
    }

    const userId = await this.sessionStore.findUserId(sessionId);
    if (!userId) {
      throw new UnauthenticatedError();
    }

    request.userId = userId;
    return true;
  }
}
