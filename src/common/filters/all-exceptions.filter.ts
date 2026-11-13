import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LogWriterService } from '../services/log-writer.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logWriter: LogWriterService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. Extraer status code HTTP y mensaje
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      const httpEx = exception as HttpException;
      statusCode = httpEx.getStatus();
      const res = httpEx.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message ?? resObj.error ?? httpEx.message;
      } else {
        message = httpEx.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const timestamp = new Date().toISOString();
    const path = request?.url ?? '';
    const method = request?.method ?? 'UNKNOWN';

    // 3. Obtener tipo de excepción y stack trace
    const exceptionType =
      exception && typeof exception === 'object' && 'constructor' in exception
        ? (exception as any).constructor.name
        : typeof exception;

    const stack = exception instanceof Error ? exception.stack : undefined;

    // 4. Persistir la excepción en disco mediante LogWriterService
    this.logWriter.writeErrorLog({
      method,
      url: path,
      statusCode,
      exceptionType,
      message: Array.isArray(message) ? message.join(', ') : String(message),
      stack,
      timestamp,
    });

    // 5. Devolver respuesta JSON formateada al cliente
    response.status(statusCode).json({
      statusCode,
      timestamp,
      path,
      message,
    });
  }
}
