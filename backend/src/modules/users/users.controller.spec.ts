import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: Partial<Record<keyof UsersService, any>>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUsersService = {
      findById: vi.fn(),
      update: vi.fn(),
    };

    controller = new UsersController(mockUsersService as UsersService);
  });

  describe('getUser', () => {
    it('should return user without passwordHash or refreshTokenHash', async () => {
      const mockDoc = {
        toObject: () => ({
          _id: '123',
          email: 'test@example.com',
          displayName: 'Test',
          passwordHash: 'secret_hash',
          refreshTokenHash: 'refresh_secret',
          settings: { dailyReviewGoal: 20 },
        }),
      };
      mockUsersService.findById.mockResolvedValue(mockDoc);

      const result = await controller.getUser('123');

      expect(mockUsersService.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual({
        _id: '123',
        email: 'test@example.com',
        displayName: 'Test',
        settings: { dailyReviewGoal: 20 },
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshTokenHash');
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(controller.getUser('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should update user and return result without sensitive fields', async () => {
      const mockDoc = {
        toObject: () => ({
          _id: '123',
          email: 'test@example.com',
          displayName: 'Updated Name',
          passwordHash: 'secret_hash',
          refreshTokenHash: 'refresh_secret',
        }),
      };
      mockUsersService.update.mockResolvedValue(mockDoc);

      const result = await controller.updateUser('123', { displayName: 'Updated Name' });

      expect(mockUsersService.update).toHaveBeenCalledWith('123', {
        displayName: 'Updated Name',
      });
      expect(result).toHaveProperty('displayName', 'Updated Name');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshTokenHash');
    });
  });

  describe('updateSettings', () => {
    it('should merge settings, call service update, and return user without sensitive fields', async () => {
      const initialUser = {
        toObject: () => ({
          _id: '123',
          settings: {
            dailyReviewGoal: 20,
            quizDefaultCount: 10,
            timezone: 'UTC',
          },
        }),
      };
      const updatedUser = {
        toObject: () => ({
          _id: '123',
          passwordHash: 'secret',
          refreshTokenHash: 'secret',
          settings: {
            dailyReviewGoal: 30,
            quizDefaultCount: 10,
            timezone: 'UTC',
          },
        }),
      };

      mockUsersService.findById.mockResolvedValue(initialUser);
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateSettings('123', { dailyReviewGoal: 30 });

      expect(mockUsersService.findById).toHaveBeenCalledWith('123');
      expect(mockUsersService.update).toHaveBeenCalledWith('123', {
        settings: {
          dailyReviewGoal: 30,
          quizDefaultCount: 10,
          timezone: 'UTC',
        },
      });
      expect(result.settings.dailyReviewGoal).toBe(30);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshTokenHash');
    });

    it('should throw NotFoundException if user is not found when updating settings', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        controller.updateSettings('999', { dailyReviewGoal: 30 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
