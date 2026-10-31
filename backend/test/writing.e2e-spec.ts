import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard.js';
import { WritingService } from '../src/modules/writing/writing.service.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';

describe('WritingController (e2e)', () => {
  let app: INestApplication;
  let mockWritingService: any;

  beforeEach(async () => {
    mockWritingService = {
      reviewWriting: vi.fn(),
      getHistory: vi.fn(),
      getReviewById: vi.fn(),
      deleteReview: vi.fn(),
      getSuggestedWords: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WritingService)
      .useValue(mockWritingService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 'user-writing-e2e',
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

  describe('POST /writing/review', () => {
    it('should submit text and return review feedback and suggestions in envelope', async () => {
      mockWritingService.reviewWriting.mockResolvedValue({
        _id: 'review-123',
        originalText: 'I have went to school yesterday because the weather was very sunny.',
        wordCount: 11,
        feedback: 'Overall clear communication with minor tense issues.',
        suggestions: ["Use 'went' instead of 'have went'."],
        aiModel: 'gemini-flash-lite-latest',
        createdAt: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/writing/review')
        .send({ text: 'I have went to school yesterday because the weather was very sunny.' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe('review-123');
      expect(res.body.data.wordCount).toBe(11);
      expect(res.body.data.feedback).toBe('Overall clear communication with minor tense issues.');
      expect(res.body.data.suggestions).toEqual(["Use 'went' instead of 'have went'."]);
    });

    it('should return 400 if text is shorter than 20 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/writing/review')
        .send({ text: 'Short text' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /writing/history', () => {
    it('should return paginated writing history in envelope', async () => {
      mockWritingService.getHistory.mockResolvedValue({
        items: [
          {
            _id: 'review-123',
            originalText: 'I have went to school yesterday...',
            wordCount: 11,
            suggestionsCount: 1,
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app.getHttpServer())
        .get('/writing/history?page=1&limit=10')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0]._id).toBe('review-123');
      expect(res.body.data.items[0].wordCount).toBe(11);
    });
  });

  describe('GET /writing/history/:id', () => {
    it('should return writing review detail in envelope', async () => {
      mockWritingService.getReviewById.mockResolvedValue({
        _id: 'review-123',
        originalText: 'Full submitted text goes here.',
        wordCount: 5,
        feedback: 'Good work.',
        suggestions: ['Suggestion 1'],
        aiModel: 'gemini-flash-lite-latest',
        createdAt: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .get('/writing/history/review-123')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe('review-123');
      expect(res.body.data.feedback).toBe('Good work.');
    });
  });

  describe('DELETE /writing/history/:id', () => {
    it('should soft delete writing review', async () => {
      mockWritingService.deleteReview.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .delete('/writing/history/review-123')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({ success: true });
    });
  });

  describe('GET /writing/suggested-words', () => {
    it('should return suggested words list from user vocabulary bank', async () => {
      mockWritingService.getSuggestedWords.mockResolvedValue({
        words: ['resilient', 'ubiquitous', 'scale'],
      });

      const res = await request(app.getHttpServer())
        .get('/writing/suggested-words')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.words).toEqual(['resilient', 'ubiquitous', 'scale']);
    });
  });
});

