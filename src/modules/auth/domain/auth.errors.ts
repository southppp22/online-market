import { UnauthorizedDomainError } from '../../../common/errors/unauthorized.domain-error';

export class InvalidCredentialsError extends UnauthorizedDomainError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('이메일 또는 비밀번호가 올바르지 않습니다.');
  }
}

export class UnauthenticatedError extends UnauthorizedDomainError {
  readonly code = 'UNAUTHENTICATED';

  constructor() {
    super('인증이 필요합니다.');
  }
}
