import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUsersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    mockJwtService = {
      sign: vi.fn().mockImplementation((payload) => `signed-${payload.sub}`),
      verify: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-jwt-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        if (key === 'JWT_EXPIRATION') return '15m';
        if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
        return null;
      }),
    };

    service = new AuthService(mockUsersService, mockJwtService, mockConfigService);
  });

  describe('register', () => {
    it('should register a new user and return tokens and user profile', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const createdUser = {
        _id: 'user-123',
        email: 'test@example.com',
        displayName: 'test',
        avatarUrl: null,
      };
      mockUsersService.create.mockResolvedValue(createdUser);
      mockUsersService.update.mockResolvedValue(createdUser);

      vi.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed_val' as any);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          displayName: 'test',
          passwordHash: 'hashed_val',
        }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'test',
        avatarUrl: null,
      });
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ _id: 'existing-id' });

      await expect(
        service.register({
          email: 'existing@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should successfully login and return tokens when credentials are valid', async () => {
      const existingUser = {
        _id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        passwordHash: 'hashed_password',
      };
      mockUsersService.findByEmail.mockResolvedValue(existingUser);
      mockUsersService.update.mockResolvedValue(existingUser);

      vi.spyOn(bcrypt, 'compare').mockImplementation(async () => true as any);
      vi.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed_refresh' as any);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe('user-123');
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user-123',
        passwordHash: 'hashed_password',
      });

      vi.spyOn(bcrypt, 'compare').mockImplementation(async () => false as any);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong_password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return a new accessToken if refresh token is valid', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-123', email: 'test@example.com' });
      mockUsersService.findById.mockResolvedValue({
        _id: 'user-123',
        email: 'test@example.com',
        refreshTokenHash: 'hashed_refresh',
      });

      vi.spyOn(bcrypt, 'compare').mockImplementation(async () => true as any);

      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException if refresh token verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found or no refreshTokenHash', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-123', email: 'test@example.com' });
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refresh('valid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token hash does not match', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-123', email: 'test@example.com' });
      mockUsersService.findById.mockResolvedValue({
        _id: 'user-123',
        email: 'test@example.com',
        refreshTokenHash: 'hashed_refresh',
      });

      vi.spyOn(bcrypt, 'compare').mockImplementation(async () => false as any);

      await expect(service.refresh('wrong-refresh-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear refreshTokenHash and return success', async () => {
      mockUsersService.update.mockResolvedValue({});

      const result = await service.logout('user-123');

      expect(mockUsersService.update).toHaveBeenCalledWith('user-123', {
        refreshTokenHash: null,
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      mockUsersService.findById.mockResolvedValue({
        _id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        settings: { dailyReviewGoal: 20 },
      });

      const result = await service.getMe('user-123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        role: 'user',
        permissions: [],
        settings: { dailyReviewGoal: 20 },
      });
    });

    it('should return populated role and permissions when user has roleId', async () => {
      mockUsersService.findById.mockResolvedValue({
        _id: 'user-123',
        email: 'admin@example.com',
        displayName: 'Admin User',
        avatarUrl: null,
        roleId: {
          name: 'admin',
          permissions: [
            { name: 'users:read', isDeleted: false },
            { name: 'roles:manage', isDeleted: false },
            { name: 'deleted:perm', isDeleted: true },
          ],
        },
        settings: { dailyReviewGoal: 20 },
      });

      const result = await service.getMe('user-123');

      expect(result.role).toBe('admin');
      expect(result.permissions).toEqual(['users:read', 'roles:manage']);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.getMe('user-999')).rejects.toThrow(NotFoundException);
    });
  });
});
