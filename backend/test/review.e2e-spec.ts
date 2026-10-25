import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard.js';
import { ReviewService } from '../src/modules/review/review.service.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';

describe('ReviewController (e2e)', () => {
  let app: INestApplication;
  let mockReviewService: any;

  beforeEach(async () => {
    mockReviewService = {
      getDueOccurrences: vi.fn(),
      recordReviewResult: vi.fn(),
      suspendCard: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ReviewService)
      .useValue(mockReviewService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            userId: 'user-review-e2e',
            email: 'test@example.com',
            role: 'user',
            permissions: [],
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new TransformInterceptor(reflector));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /review/due', () => {
    it('should return due occurrences in standard response envelope', async () => {
      mockReviewService.getDueOccurrences.mockResolvedValue({
        occurrences: [
          {
            id: 'occ-1',
            lemma: 'ephemeral',
            sentence: 'The beauty of a sunset is ephemeral.',
            meaning: 'Phù du, chóng tàn',
            partOfSpeech: 'adjective',
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/review/due')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.occurrences).toHaveLength(1);
      expect(response.body.data.occurrences[0].lemma).toBe('ephemeral');
      expect(mockReviewService.getDueOccurrences).toHaveBeenCalledWith('user-review-e2e');
    });
  });

  describe('POST /review/:occurrenceId/result', () => {
    it('should update review schedule and return nextDueDate and intervalDays', async () => {
      mockReviewService.recordReviewResult.mockResolvedValue({
        nextDueDate: '2026-10-31T12:00:00.000Z',
        intervalDays: 6,
      });

      const response = await request(app.getHttpServer())
        .post('/review/occ-123/result')
        .send({ remembered: true })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        nextDueDate: '2026-10-31T12:00:00.000Z',
        intervalDays: 6,
      });
      expect(mockReviewService.recordReviewResult).toHaveBeenCalledWith(
        'user-review-e2e',
        'occ-123',
        { remembered: true },
      );
    });

    it('should fail validation when remembered is missing or non-boolean', async () => {
      const response = await request(app.getHttpServer())
        .post('/review/occ-123/result')
        .send({ remembered: 'yes' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /review/:occurrenceId/suspend', () => {
    it('should toggle card suspension status', async () => {
      mockReviewService.suspendCard.mockResolvedValue({
        success: true,
        suspended: true,
      });

      const response = await request(app.getHttpServer())
        .patch('/review/occ-123/suspend')
        .send({ suspended: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        success: true,
        suspended: true,
      });
      expect(mockReviewService.suspendCard).toHaveBeenCalledWith(
        'user-review-e2e',
        'occ-123',
        { suspended: true },
      );
    });
  });
});
