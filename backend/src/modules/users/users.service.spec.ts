import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User } from './schemas/user.schema.js';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserModel = vi.fn().mockImplementation(function (this: any, dto: any) {
      Object.assign(this, dto);
      this.save = vi.fn().mockResolvedValue({ _id: 'user-123', ...dto });
    });

    mockUserModel.findOne = vi.fn();
    mockUserModel.findOneAndUpdate = vi.fn();

    service = new UsersService(mockUserModel as any);
  });

  describe('create', () => {
    it('should create and save a new user with default settings', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash: 'hashed_password',
      };

      const result = await service.create(userData as Partial<User>);

      expect(mockUserModel).toHaveBeenCalledWith(
        expect.objectContaining({
          ...userData,
          settings: {
            dailyReviewGoal: 20,
            quizDefaultCount: 10,
            timezone: 'UTC',
          },
        }),
      );
      expect(result).toHaveProperty('_id', 'user-123');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('findByEmail', () => {
    it('should query active user by email', async () => {
      const mockUser = { _id: '123', email: 'test@example.com', isDeleted: false };
      mockUserModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByEmail('test@example.com');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        isDeleted: false,
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should query active user by id', async () => {
      const mockUser = { _id: '123', email: 'test@example.com', isDeleted: false };
      mockUserModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findById('123');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        _id: '123',
        isDeleted: false,
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      const result = await service.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const updatedUser = { _id: '123', displayName: 'Updated Name' };
      mockUserModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.update('123', { displayName: 'Updated Name' });

      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '123', isDeleted: false },
        { $set: { displayName: 'Updated Name' } },
        { new: true },
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found for update', async () => {
      mockUserModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.update('999', { displayName: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
