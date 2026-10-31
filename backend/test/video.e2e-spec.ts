import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard.js';
import { VideoService } from '../src/modules/video/video.service.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';

describe('VideoController (e2e)', () => {
  let app: INestApplication;
  let mockVideoService: any;

  beforeEach(async () => {
    mockVideoService = {
      getTranscript: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VideoService)
      .useValue(mockVideoService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            userId: 'user-video-123',
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

  describe('POST /video/transcript', () => {
    it('should validate request body and reject empty videoUrl', async () => {
      const res = await request(app.getHttpServer())
        .post('/video/transcript')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return transcript data wrapped in standard envelope', async () => {
      mockVideoService.getTranscript.mockResolvedValue({
        videoId: 'dQw4w9WgXcQ',
        provider: 'youtube',
        videoTitle: 'Sample Video',
        durationSeconds: 212,
        segments: [
          { index: 0, startSeconds: 1.0, endSeconds: 3.5, text: 'Hello world', translation: null },
        ],
      });

      const res = await request(app.getHttpServer())
        .post('/video/transcript')
        .send({
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          language: 'en',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.videoId).toBe('dQw4w9WgXcQ');
      expect(res.body.data.segments).toHaveLength(1);
    });
  });
});
