export const SESSION_TTL_SECONDS = 60 * 60 * 24;

export abstract class SessionStore {
  abstract createSession(userId: string): Promise<string>;
  abstract findUserId(sessionId: string): Promise<string | null>;
  abstract deleteSession(sessionId: string): Promise<void>;
}
