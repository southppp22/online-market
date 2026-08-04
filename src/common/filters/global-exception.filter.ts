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
    if (status >= 500) {
      this.logger.error(exception);
    }
    response.status(status).json(body);
  }

  private toErrorResponse(exception: unknown): {
    status: number;
    body: ErrorBody;
  } {
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
