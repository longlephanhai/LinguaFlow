import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArgumentsHost, BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new AllExceptionsFilter();
  });

  const createMockHost = () => {
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockResponse = { status: mockStatus };
    const mockContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;

    return { mockContext, mockStatus, mockJson };
  };

  it('should format HttpException with validation errors correctly', () => {
    const { mockContext, mockStatus, mockJson } = createMockHost();
    const exception = new BadRequestException({
      message: ['email must be an email', 'password is too short'],
      error: 'Bad Request',
    });

    filter.catch(exception, mockContext);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      status: HttpStatus.BAD_REQUEST,
      message: 'email must be an email',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'email must be an email',
      },
    });
  });

  it('should format NotFoundException correctly', () => {
    const { mockContext, mockStatus, mockJson } = createMockHost();
    const exception = new NotFoundException('Vocabulary item not found');

    filter.catch(exception, mockContext);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      status: HttpStatus.NOT_FOUND,
      message: 'Vocabulary item not found',
      error: {
        code: 'NOT_FOUND',
        message: 'Vocabulary item not found',
      },
    });
  });

  it('should handle unhandled non-Http exceptions as 500 INTERNAL_SERVER_ERROR', () => {
    const { mockContext, mockStatus, mockJson } = createMockHost();
    const exception = new Error('Database connection failed');

    filter.catch(exception, mockContext);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  });
});
