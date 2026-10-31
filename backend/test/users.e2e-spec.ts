import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { UsersService } from '../src/modules/users/users.service.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';
import { JwtService } from '@nestjs/jwt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let mockUsersService: any;
  let jwtService: JwtService;
  let validToken: string;
  const mockUserId = '654321654321654321654321';

  beforeEach(async () => {
    mockUsersService = {
      findById: vi.fn(),
      update: vi.fn(),
    };

    const defaultUser = {
      _id: mockUserId,
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: null,
      roleId: null,
      settings: {
        dailyReviewGoal: 20,
        quizDefaultCount: 10,
        timezone: 'UTC',
      },
      toObject: () => ({
        _id: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        roleId: null,
        settings: {
          dailyReviewGoal: 20,
          quizDefaultCount: 10,
          timezone: 'UTC',
        },
      }),
    };
    mockUsersService.findById.mockResolvedValue(defaultUser);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
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

    jwtService = moduleFixture.get<JwtService>(JwtService);
    validToken = jwtService.sign(
      { sub: mockUserId, email: 'test@example.com' },
      { secret: 'linguaflow-super-secret-jwt-key' },
    );
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer()).get('/users/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return current user profile with me alias', async () => {
      const mockDoc = {
        toObject: () => ({
          _id: mockUserId,
          email: 'test@example.com',
          displayName: 'Test User',
          avatarUrl: 'https://example.com/avatar.png',
          passwordHash: 'secret_hash',
          refreshTokenHash: 'refresh_hash',
          settings: {
            dailyReviewGoal: 20,
            quizDefaultCount: 10,
            timezone: 'UTC',
          },
        }),
      };
      mockUsersService.findById.mockResolvedValue(mockDoc);

      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(mockUserId);
      expect(res.body.data.displayName).toBe('Test User');
      expect(res.body.data.settings.dailyReviewGoal).toBe(20);
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data).not.toHaveProperty('refreshTokenHash');
      expect(mockUsersService.findById).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update current user profile', async () => {
      const updatedDoc = {
        toObject: () => ({
          _id: mockUserId,
          email: 'test@example.com',
          displayName: 'Updated Name',
          avatarUrl: 'https://example.com/new-avatar.png',
          passwordHash: 'secret_hash',
          refreshTokenHash: 'refresh_hash',
          settings: { dailyReviewGoal: 20 },
        }),
      };
      mockUsersService.update.mockResolvedValue(updatedDoc);

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          displayName: 'Updated Name',
          avatarUrl: 'https://example.com/new-avatar.png',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Updated Name');
      expect(res.body.data.avatarUrl).toBe('https://example.com/new-avatar.png');
      expect(mockUsersService.update).toHaveBeenCalledWith(mockUserId, {
        displayName: 'Updated Name',
        avatarUrl: 'https://example.com/new-avatar.png',
      });
    });

    it('should reject invalid avatarUrl', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          avatarUrl: 'not-a-valid-url',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /users/me/settings', () => {
    it('should update user study preferences', async () => {
      const initialUser = {
        toObject: () => ({
          _id: mockUserId,
          settings: {
            dailyReviewGoal: 20,
            quizDefaultCount: 10,
            timezone: 'UTC',
          },
        }),
      };
      const updatedDoc = {
        toObject: () => ({
          _id: mockUserId,
          settings: {
            dailyReviewGoal: 35,
            quizDefaultCount: 15,
            timezone: 'Asia/Ho_Chi_Minh',
          },
          passwordHash: 'secret_hash',
          refreshTokenHash: 'refresh_hash',
        }),
      };

      mockUsersService.findById.mockResolvedValue(initialUser);
      mockUsersService.update.mockResolvedValue(updatedDoc);

      const res = await request(app.getHttpServer())
        .patch('/users/me/settings')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dailyReviewGoal: 35,
          quizDefaultCount: 15,
          timezone: 'Asia/Ho_Chi_Minh',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.settings.dailyReviewGoal).toBe(35);
      expect(res.body.data.settings.quizDefaultCount).toBe(15);
      expect(res.body.data.settings.timezone).toBe('Asia/Ho_Chi_Minh');
    });

    it('should reject dailyReviewGoal exceeding 100', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me/settings')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dailyReviewGoal: 101,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
