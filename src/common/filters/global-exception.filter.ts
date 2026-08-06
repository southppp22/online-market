import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../errors/domain-error';
import { httpStatusOfDomainError } from './domain-error-http-status';
import { isOverloadError } from './overload-error';

interface ErrorBody {
  code: string;
  message: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toErrorResponse(exception);
    if (status === HttpStatus.SERVICE_UNAVAILABLE) {
      this.logger.warn(exception);
      response.setHeader('Retry-After', '1');
    } else if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }
    response.status(status).json(body);
  }

  private toErrorResponse(exception: unknown): {
    status: HttpStatus;
    body: ErrorBody;
  } {
    if (isOverloadError(exception)) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        body: {
          code: 'SERVICE_UNAVAILABLE',
          message: '요청이 많아 처리하지 못했습니다',
        },
      };
    }
    if (exception instanceof DomainError) {
      return {
        status: httpStatusOfDomainError(exception),
        body: { code: exception.code, message: exception.message },
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        body: {
          code: HttpStatus[status] ?? 'HTTP_ERROR',
          message: this.extractMessage(exception),
        },
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    };
  }

  private extractMessage(exception: HttpException): string {
    const res = exception.getResponse();
    if (typeof res === 'string') return res;
    const message = (res as { message?: string | string[] }).message;
    if (Array.isArray(message)) return message.join(', ');
    return message ?? exception.message;
  }
}
