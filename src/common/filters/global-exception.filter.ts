import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      message = exception.message;

      const errorResponse = exception.getResponse();
      if (
        typeof errorResponse === 'object' &&
        errorResponse !== null &&
        'message' in errorResponse
      ) {
        const msgs = (errorResponse as { message: unknown }).message;
        if (Array.isArray(msgs)) {
          details = msgs;
        }
      }
    }
    else if (
      exception instanceof Error &&
      exception.constructor.name === 'PrismaClientKnownRequestError'
    ) {
      const prismaError = exception as unknown as { code: string; meta?: { target?: string[] } };
      switch (prismaError.code) {
        case 'P2002': // Unique constraint
          statusCode = HttpStatus.CONFLICT;
          const fields = (prismaError.meta?.target as string[])?.join(', ');
          message = `Unique constraint violation on: ${fields}`;
          break;
        case 'P2025': // Record not found
          statusCode = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2003': // Foreign key constraint
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Related record not found';
          break;
        default:
          message = `Database error: ${prismaError.code}`;
      }
    }

    this.logger.error(
      {
        statusCode,
        path: request.url,
        method: request.method,
        ...(exception instanceof Error && { stack: exception.stack }),
      },
      message,
    );

    response.status(statusCode).json({
      success: false,
      error: {
        code: HttpStatus[statusCode] || 'UNKNOWN_ERROR',
        message,
        statusCode,
        ...(details != null ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
      requestId:
        (request as Request & { id?: string }).id ||
        (request.headers['x-request-id'] as string) ||
        null,
    });
  }
}
