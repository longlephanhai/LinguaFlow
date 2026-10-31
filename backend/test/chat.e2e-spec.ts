import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard.js';
import { ChatService } from '../src/modules/chat/chat.service.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';

describe('ChatController (e2e)', () => {
  let app: INestApplication;
  let mockChatService: any;

  beforeEach(async () => {
    mockChatService = {
      sendMessage: vi.fn(),
      getSessions: vi.fn(),
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      getSuggestedWords: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ChatService)
      .useValue(mockChatService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 'user-chat-e2e',
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

  describe('POST /chat/message', () => {
    it('should send a message and return sessionId and reply', async () => {
      mockChatService.sendMessage.mockResolvedValue({
        sessionId: 'session-123',
        reply: 'Hello! Let us practice English.',
      });

      const res = await request(app.getHttpServer())
        .post('/chat/message')
        .send({ message: 'Hello AI' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe('session-123');
      expect(res.body.data.reply).toBe('Hello! Let us practice English.');
    });

    it('should return 400 if message is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/chat/message')
        .send({ message: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /chat/sessions', () => {
    it('should return paginated sessions', async () => {
      mockChatService.getSessions.mockResolvedValue({
        items: [
          {
            id: 'session-123',
            title: 'Hello AI',
            messageCount: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app.getHttpServer())
        .get('/chat/sessions?page=1&limit=10')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].id).toBe('session-123');
    });
  });

  describe('GET /chat/sessions/:id', () => {
    it('should return full session details', async () => {
      mockChatService.getSession.mockResolvedValue({
        id: 'session-123',
        title: 'Hello AI',
        messages: [
          { role: 'user', content: 'Hello AI', createdAt: new Date() },
          { role: 'assistant', content: 'Hello user', createdAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app.getHttpServer())
        .get('/chat/sessions/session-123')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('session-123');
      expect(res.body.data.messages).toHaveLength(2);
    });
  });

  describe('DELETE /chat/sessions/:id', () => {
    it('should soft delete session', async () => {
      mockChatService.deleteSession.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .delete('/chat/sessions/session-123')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.success).toBe(true);
    });
  });

  describe('GET /chat/suggested-words', () => {
    it('should return suggested words list', async () => {
      mockChatService.getSuggestedWords.mockResolvedValue({
        words: ['resilient', 'ubiquitous'],
      });

      const res = await request(app.getHttpServer())
        .get('/chat/suggested-words')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.words).toEqual(['resilient', 'ubiquitous']);
    });
  });
});
