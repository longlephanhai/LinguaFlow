import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from '../decorators/response-message.decorator.js';

export interface Response<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const message =
          this.reflector.get<string>(
            RESPONSE_MESSAGE,
            context.getHandler(),
          ) || 'Success';
          
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const status = response.statusCode;

        return {
          success: true,
          status,
          message,
          data,
        };
      }),
    );
  }
}
