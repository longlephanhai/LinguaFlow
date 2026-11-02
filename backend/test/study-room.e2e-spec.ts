import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard.js';
import { DictationService } from '../src/modules/dictation/dictation.service.js';
import { ShadowingService } from '../src/modules/shadowing/shadowing.service.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';

describe('Study Room Endpoints (e2e)', () => {
  let app: INestApplication;
  let mockDictationService: any;
  let mockShadowingService: any;

  beforeEach(async () => {
    mockDictationService = {
      recordSession: vi.fn(),
    };

    mockShadowingService = {
      evaluate: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DictationService)
      .useValue(mockDictationService)
      .overrideProvider(ShadowingService)
      .useValue(mockShadowingService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            userId: 'user-room-123',
            email: 'learner@example.com',
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

  describe('POST /dictation/sessions', () => {
    it('should validate request body and reject invalid fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/dictation/sessions')
        .send({
          videoId: 'vid-123',
          accuracyScore: 150, // exceeds max 100
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should record session and return standard response envelope', async () => {
      mockDictationService.recordSession.mockResolvedValue({
        sessionId: 'dict-session-1',
        accuracyScore: 94,
        recordedAt: '2026-11-02T12:00:00.000Z',
      });

      const res = await request(app.getHttpServer())
        .post('/dictation/sessions')
        .send({
          videoId: 'vid-123',
          completedSegments: 10,
          totalSegments: 10,
          accuracyScore: 94,
          timeSpentSeconds: 120,
          mistakesCount: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe('dict-session-1');
      expect(res.body.data.accuracyScore).toBe(94);
    });
  });

  describe('POST /shadowing/evaluate', () => {
    it('should validate targetText presence', async () => {
      const res = await request(app.getHttpServer())
        .post('/shadowing/evaluate')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should evaluate shadowing audio / transcript and return structured scores', async () => {
      mockShadowingService.evaluate.mockResolvedValue({
        overallScore: 89,
        transcribedText: 'This is a sample sentence.',
        wordsEvaluation: [
          { word: 'This', status: 'correct', phonemeFeedback: null },
          { word: 'is', status: 'correct', phonemeFeedback: null },
        ],
        generalTips: 'Great intonation!',
      });

      const res = await request(app.getHttpServer())
        .post('/shadowing/evaluate')
        .send({
          targetText: 'This is a sample sentence.',
          userTranscript: 'This is a sample sentence.',
          videoId: 'vid-123',
          segmentIndex: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallScore).toBe(89);
      expect(res.body.data.wordsEvaluation).toHaveLength(2);
    });
  });
});
