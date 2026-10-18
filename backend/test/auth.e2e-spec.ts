import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module.js';
import { UsersService } from '../src/modules/users/users.service.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let mockUsersService: any;

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return standard envelope', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const fakeUser = {
        _id: 'user-e2e-1',
        email: 'e2e@example.com',
        displayName: 'e2e',
        avatarUrl: null,
      };
      mockUsersService.create.mockResolvedValue(fakeUser);
      mockUsersService.update.mockResolvedValue(fakeUser);

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'e2e@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('e2e@example.com');
    });

    it('should return 400 VALIDATION_ERROR on invalid input', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'invalid-email', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const passwordHash = await bcrypt.hash('secretPass123', 10);
      const fakeUser = {
        _id: 'user-e2e-2',
        email: 'login@example.com',
        displayName: 'Login User',
        avatarUrl: null,
        passwordHash,
      };
      mockUsersService.findByEmail.mockResolvedValue(fakeUser);
      mockUsersService.update.mockResolvedValue(fakeUser);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@example.com', password: 'secretPass123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.id).toBe('user-e2e-2');
    });

    it('should return 401 UNAUTHORIZED on incorrect password', async () => {
      const passwordHash = await bcrypt.hash('secretPass123', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user-e2e-2',
        passwordHash,
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@example.com', password: 'wrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 if no Authorization header provided', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
