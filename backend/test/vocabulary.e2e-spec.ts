import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard.js';
import { VocabularyService } from '../src/modules/vocabulary/vocabulary.service.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';

describe('VocabularyController (e2e)', () => {
  let app: INestApplication;
  let mockVocabService: any;

  beforeEach(async () => {
    mockVocabService = {
      saveOccurrence: vi.fn(),
      findAll: vi.fn(),
      findOccurrences: vi.fn(),
      updateOccurrence: vi.fn(),
      deleteOccurrence: vi.fn(),
      deleteVocabularyItem: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VocabularyService)
      .useValue(mockVocabService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            userId: 'user-e2e-123',
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

  describe('POST /vocabulary/occurrences', () => {
    it('should save occurrence and return IDs in envelope', async () => {
      mockVocabService.saveOccurrence.mockResolvedValue({
        occurrenceId: 'occ-1',
        vocabularyItemId: 'vocab-1',
        meaningId: 'meaning-1',
      });

      const response = await request(app.getHttpServer())
        .post('/vocabulary/occurrences')
        .send({
          lemma: 'ephemeral',
          meaning: 'lasting a short time',
          sentence: 'Life is ephemeral.',
          sourceUrl: 'https://example.com/life',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        occurrenceId: 'occ-1',
        vocabularyItemId: 'vocab-1',
        meaningId: 'meaning-1',
      });
      expect(mockVocabService.saveOccurrence).toHaveBeenCalledWith(
        expect.objectContaining({
          lemma: 'ephemeral',
          meaning: 'lasting a short time',
        }),
        'user-e2e-123',
      );
    });

    it('should fail validation on missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/vocabulary/occurrences')
        .send({
          lemma: 'ephemeral',
          // missing meaning, sentence, sourceUrl
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /vocabulary', () => {
    it('should return paginated vocabulary list', async () => {
      mockVocabService.findAll.mockResolvedValue({
        items: [
          {
            id: 'vocab-1',
            lemma: 'ephemeral',
            meaningsCount: 1,
            occurrencesCount: 1,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/vocabulary?page=1&limit=20')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
    });
  });

  describe('DELETE /vocabulary/:id', () => {
    it('should delete vocabulary item and return success envelope', async () => {
      mockVocabService.deleteVocabularyItem.mockResolvedValue({ success: true });

      const response = await request(app.getHttpServer())
        .delete('/vocabulary/vocab-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({ success: true });
      expect(mockVocabService.deleteVocabularyItem).toHaveBeenCalledWith(
        'user-e2e-123',
        'vocab-1',
      );
    });
  });
});
