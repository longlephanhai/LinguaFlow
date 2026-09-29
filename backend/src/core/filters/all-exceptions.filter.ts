import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Internal server error';

    // Xử lý trường hợp message là mảng (thường thấy khi dùng class-validator)
    const finalMessage = Array.isArray(message) ? message[0] : message;

    // Map HTTP status or exception to defined error codes in @docs/API-CONTRACTS.md
    let defaultCode = 'INTERNAL_SERVER_ERROR';
    if (status === HttpStatus.BAD_REQUEST) defaultCode = 'VALIDATION_ERROR';
    else if (status === HttpStatus.UNAUTHORIZED) defaultCode = 'UNAUTHORIZED';
    else if (status === HttpStatus.NOT_FOUND) defaultCode = 'NOT_FOUND';
    else if (status === HttpStatus.TOO_MANY_REQUESTS) defaultCode = 'RATE_LIMITED';
    else if (status === HttpStatus.BAD_GATEWAY || status === HttpStatus.SERVICE_UNAVAILABLE) defaultCode = 'AI_PROVIDER_ERROR';

    const code =
      typeof exceptionResponse === 'object' && (exceptionResponse as any).code
        ? (exceptionResponse as any).code
        : defaultCode;

    response.status(status).json({
      success: false,
      status,
      message: finalMessage,
      error: {
        code,
        message: finalMessage,
      },
    });
  }
}
