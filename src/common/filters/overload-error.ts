import { QueryFailedError } from 'typeorm';

const MYSQL_QUEUE_LIMIT_MESSAGE = 'Queue limit reached.';
const MYSQL_ER_QUERY_TIMEOUT = 3024;

export function isOverloadError(exception: unknown): boolean {
  if (exception instanceof QueryFailedError) {
    const { errno } = exception.driverError as { errno?: number };
    return errno === MYSQL_ER_QUERY_TIMEOUT;
  }
  return (
    exception instanceof Error &&
    exception.message === MYSQL_QUEUE_LIMIT_MESSAGE
  );
}
