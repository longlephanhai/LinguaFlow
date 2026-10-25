import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard.js';
import { QuizService } from '../src/modules/quiz/quiz.service.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';

describe('QuizController (e2e)', () => {
  let app: INestApplication;
  let mockQuizService: any;

  beforeEach(async () => {
    mockQuizService = {
      generate: vi.fn(),
      answer: vi.fn(),
      getResult: vi.fn(),
      getHistory: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(QuizService)
      .useValue(mockQuizService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 'user-quiz-e2e',
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

  describe('POST /quiz/generate', () => {
    it('should generate a quiz and return sanitized questions', async () => {
      mockQuizService.generate.mockResolvedValue({
        quizId: 'quiz-123',
        questions: [
          {
            index: 0,
            questionText: 'What does "scale" mean in this context?',
            options: ['Weigh', 'Grow', 'Climb', 'Reduce'],
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/quiz/generate')
        .send({ scope: 'all', count: 10 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quizId).toBe('quiz-123');
      expect(response.body.data.questions).toHaveLength(1);
      expect(response.body.data.questions[0].options).toHaveLength(4);
      expect(mockQuizService.generate).toHaveBeenCalledWith('user-quiz-e2e', {
        scope: 'all',
        count: 10,
      });
    });

    it('should fail validation if scope is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/quiz/generate')
        .send({ scope: 'invalid-scope' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /quiz/:id/answer', () => {
    it('should record answer and return evaluation', async () => {
      mockQuizService.answer.mockResolvedValue({
        correct: true,
        correctIndex: 1,
        explanation: 'Option B is correct because of context.',
      });

      const response = await request(app.getHttpServer())
        .post('/quiz/quiz-123/answer')
        .send({ questionIndex: 0, selectedIndex: 1 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.correct).toBe(true);
      expect(response.body.data.correctIndex).toBe(1);
      expect(mockQuizService.answer).toHaveBeenCalledWith(
        'user-quiz-e2e',
        'quiz-123',
        { questionIndex: 0, selectedIndex: 1 },
      );
    });

    it('should fail validation when selectedIndex is out of range 0..3', async () => {
      const response = await request(app.getHttpServer())
        .post('/quiz/quiz-123/answer')
        .send({ questionIndex: 0, selectedIndex: 5 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /quiz/history', () => {
    it('should return paginated quiz history', async () => {
      mockQuizService.getHistory.mockResolvedValue({
        items: [
          {
            quizId: 'quiz-123',
            score: 8,
            total: 10,
            scope: 'all',
            completedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/quiz/history?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].score).toBe(8);
      expect(mockQuizService.getHistory).toHaveBeenCalledWith('user-quiz-e2e', {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('GET /quiz/:id/result', () => {
    it('should return quiz result summary', async () => {
      mockQuizService.getResult.mockResolvedValue({
        quizId: 'quiz-123',
        score: 9,
        total: 10,
        completedAt: new Date().toISOString(),
        answers: [],
      });

      const response = await request(app.getHttpServer())
        .get('/quiz/quiz-123/result')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.score).toBe(9);
      expect(mockQuizService.getResult).toHaveBeenCalledWith(
        'user-quiz-e2e',
        'quiz-123',
      );
    });
  });
});
