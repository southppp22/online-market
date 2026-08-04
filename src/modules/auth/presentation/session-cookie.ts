import type { CookieOptions } from 'express';
import { SESSION_TTL_SECONDS } from '../domain/session-store';

export const SID_COOKIE = 'sid';

export function sessionCookieOptions(
  nodeEnv: string | undefined,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: nodeEnv === 'production',
    maxAge: SESSION_TTL_SECONDS * 1000,
  };
}
