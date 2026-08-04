import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConflictDomainError } from '../errors/conflict.domain-error';
import { DomainError } from '../errors/domain-error';
import { NotFoundDomainError } from '../errors/not-found.domain-error';
import { UnauthorizedDomainError } from '../errors/unauthorized.domain-error';
import { ValidationDomainError } from '../errors/validation.domain-error';
import { GlobalExceptionFilter } from './global-exception.filter';

class StubNotFoundError extends NotFoundDomainError {
  readonly code = 'STUB_NOT_FOUND';

  constructor() {
    super('스텁을 찾을 수 없습니다');
  }
}

class StubConflictError extends ConflictDomainError {
  readonly code = 'STUB_CONFLICT';

  constructor() {
    super('스텁 상태가 충돌합니다');
  }
}

class StubValidationError extends ValidationDomainError {
  readonly code = 'STUB_VALIDATION';

  constructor() {
    super('스텁 값이 유효하지 않습니다');
  }
}

class StubUnauthorizedError extends UnauthorizedDomainError {
  readonly code = 'STUB_UNAUTHORIZED';

  constructor() {
    super('스텁 인증이 필요합니다');
  }
}

class StubUnclassifiedError extends DomainError {
  readonly code = 'STUB_UNCLASSIFIED';

  constructor() {
    super('분류 베이스 없이 정의된 스텁 에러입니다');
  }
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();
  let response: { status: jest.Mock; json: jest.Mock };
  let host: ArgumentsHost;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
  });

  it('NotFoundDomainError는 404로 응답한다', () => {
    filter.catch(new StubNotFoundError(), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      code: 'STUB_NOT_FOUND',
      message: '스텁을 찾을 수 없습니다',
    });
  });

  it('ConflictDomainError는 409로 응답한다', () => {
    filter.catch(new StubConflictError(), host);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      code: 'STUB_CONFLICT',
      message: '스텁 상태가 충돌합니다',
    });
  });

  it('ValidationDomainError는 400으로 응답한다', () => {
    filter.catch(new StubValidationError(), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      code: 'STUB_VALIDATION',
      message: '스텁 값이 유효하지 않습니다',
    });
  });

  it('UnauthorizedDomainError는 401로 응답한다', () => {
    filter.catch(new StubUnauthorizedError(), host);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      code: 'STUB_UNAUTHORIZED',
      message: '스텁 인증이 필요합니다',
    });
  });

  it('분류 베이스를 상속하지 않은 도메인 에러는 400으로 응답한다', () => {
    filter.catch(new StubUnclassifiedError(), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      code: 'STUB_UNCLASSIFIED',
      message: '분류 베이스 없이 정의된 스텁 에러입니다',
    });
  });

  it('HttpException은 상태코드 이름을 code로 사용한다', () => {
    filter.catch(new NotFoundException('없는 경로'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: '없는 경로',
    });
  });

  it('ValidationPipe의 message 배열은 하나의 문자열로 합친다', () => {
    filter.catch(
      new BadRequestException(['name은 필수입니다', 'price는 정수여야 합니다']),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      code: 'BAD_REQUEST',
      message: 'name은 필수입니다, price는 정수여야 합니다',
    });
  });

  it('알 수 없는 에러는 500과 고정 메시지로 응답한다', () => {
    filter.catch(new Error('내부 구현 노출 금지'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  });
});
