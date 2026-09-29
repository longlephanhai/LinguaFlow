import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor.js';
import { RESPONSE_MESSAGE } from '../decorators/response-message.decorator.js';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let reflector: Reflector;

  beforeEach(() => {
    vi.clearAllMocks();
    reflector = new Reflector();
    interceptor = new TransformInterceptor(reflector);
  });

  it('should transform response to standard envelope with default message', async () => {
    vi.spyOn(reflector, 'get').mockReturnValue(undefined);

    const mockResponse = { statusCode: 200 };
    const mockContext = {
      getHandler: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ foo: 'bar' }),
    };

    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({
      success: true,
      status: 200,
      message: 'Success',
      data: { foo: 'bar' },
    });
  });

  it('should use custom message when defined via ResponseMessage decorator', async () => {
    vi.spyOn(reflector, 'get').mockImplementation((metadataKey) => {
      if (metadataKey === RESPONSE_MESSAGE) {
        return 'Custom created message';
      }
      return undefined;
    });

    const mockResponse = { statusCode: 201 };
    const mockContext = {
      getHandler: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ id: '123' }),
    };

    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({
      success: true,
      status: 201,
      message: 'Custom created message',
      data: { id: '123' },
    });
  });
});
