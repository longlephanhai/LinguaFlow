import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { RolesService } from '../src/modules/roles/roles.service.js';
import { PermissionsService } from '../src/modules/permissions/permissions.service.js';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard.js';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from '../src/core/filters/all-exceptions.filter.js';

describe('Roles & Permissions (e2e)', () => {
  let app: INestApplication;
  let mockRolesService: any;
  let mockPermissionsService: any;
  let currentUserRole = 'admin';

  beforeEach(async () => {
    currentUserRole = 'admin';

    mockRolesService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    mockPermissionsService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RolesService)
      .useValue(mockRolesService)
      .overrideProvider(PermissionsService)
      .useValue(mockPermissionsService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            userId: 'test-user-id',
            email: 'admin@linguaflow.com',
            role: currentUserRole,
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

  describe('Permissions endpoints', () => {
    it('POST /permissions - should create permission when admin', async () => {
      const dto = {
        name: 'users:read',
        description: 'Read users',
        module: 'users',
        action: 'read',
      };
      mockPermissionsService.create.mockResolvedValue({ _id: 'perm-1', ...dto });

      const res = await request(app.getHttpServer())
        .post('/permissions')
        .send(dto);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('users:read');
    });

    it('POST /permissions - should return 403 FORBIDDEN when not admin', async () => {
      currentUserRole = 'user';

      const res = await request(app.getHttpServer())
        .post('/permissions')
        .send({
          name: 'users:read',
          description: 'Read users',
          module: 'users',
          action: 'read',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /permissions - should list permissions', async () => {
      mockPermissionsService.findAll.mockResolvedValue([
        { _id: 'perm-1', name: 'users:read' },
      ]);

      const res = await request(app.getHttpServer()).get('/permissions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /permissions/:id - should get single permission', async () => {
      mockPermissionsService.findById.mockResolvedValue({
        _id: 'perm-1',
        name: 'users:read',
      });

      const res = await request(app.getHttpServer()).get('/permissions/perm-1');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('users:read');
    });

    it('PATCH /permissions/:id - should update permission', async () => {
      mockPermissionsService.update.mockResolvedValue({
        _id: 'perm-1',
        description: 'New description',
      });

      const res = await request(app.getHttpServer())
        .patch('/permissions/perm-1')
        .send({ description: 'New description' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('New description');
    });

    it('DELETE /permissions/:id - should remove permission', async () => {
      mockPermissionsService.remove.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer()).delete('/permissions/perm-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ success: true });
    });
  });

  describe('Roles endpoints', () => {
    it('POST /roles - should create role when admin', async () => {
      const dto = {
        name: 'editor',
        description: 'Editor role',
        permissions: ['507f1f77bcf86cd799439011'],
        isActive: true,
      };
      mockRolesService.create.mockResolvedValue({ _id: 'role-1', ...dto });

      const res = await request(app.getHttpServer())
        .post('/roles')
        .send(dto);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('editor');
    });

    it('POST /roles - should return 400 VALIDATION_ERROR when input is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/roles')
        .send({
          name: '',
          permissions: ['invalid-mongo-id'],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /roles - should return 403 FORBIDDEN when user is not admin', async () => {
      currentUserRole = 'user';

      const res = await request(app.getHttpServer())
        .post('/roles')
        .send({
          name: 'editor',
          description: 'Editor role',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /roles - should return all roles', async () => {
      mockRolesService.findAll.mockResolvedValue([
        { _id: 'r1', name: 'admin' },
        { _id: 'r2', name: 'user' },
      ]);

      const res = await request(app.getHttpServer()).get('/roles');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('GET /roles/:id - should return single role', async () => {
      mockRolesService.findById.mockResolvedValue({ _id: 'r1', name: 'admin' });

      const res = await request(app.getHttpServer()).get('/roles/r1');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('admin');
    });

    it('PATCH /roles/:id - should update role when admin', async () => {
      mockRolesService.update.mockResolvedValue({ _id: 'r1', description: 'Updated' });

      const res = await request(app.getHttpServer())
        .patch('/roles/r1')
        .send({ description: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated');
    });

    it('DELETE /roles/:id - should delete role when admin', async () => {
      mockRolesService.remove.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer()).delete('/roles/r1');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ success: true });
    });
  });
});
