import { HttpStatus } from '@nestjs/common';
import { ConflictDomainError } from '../errors/conflict.domain-error';
import { DomainError } from '../errors/domain-error';
import { NotFoundDomainError } from '../errors/not-found.domain-error';
import { UnauthorizedDomainError } from '../errors/unauthorized.domain-error';
import { ValidationDomainError } from '../errors/validation.domain-error';

export function httpStatusOfDomainError(error: DomainError): HttpStatus {
  if (error instanceof NotFoundDomainError) return HttpStatus.NOT_FOUND;
  if (error instanceof ConflictDomainError) return HttpStatus.CONFLICT;
  if (error instanceof ValidationDomainError) return HttpStatus.BAD_REQUEST;
  if (error instanceof UnauthorizedDomainError) return HttpStatus.UNAUTHORIZED;
  return HttpStatus.BAD_REQUEST;
}
