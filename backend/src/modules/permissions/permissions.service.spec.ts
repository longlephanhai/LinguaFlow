import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PermissionsService } from './permissions.service.js';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockPermissionModel: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPermissionModel = vi.fn().mockImplementation(function (this: any, dto: any) {
      Object.assign(this, dto);
      this.save = vi.fn().mockResolvedValue({ _id: 'perm-1', ...dto });
    });

    mockPermissionModel.find = vi.fn();
    mockPermissionModel.findOne = vi.fn();
    mockPermissionModel.findOneAndUpdate = vi.fn();

    service = new PermissionsService(mockPermissionModel as any);
  });

  describe('create', () => {
    it('should create and return a permission if name is unique', async () => {
      mockPermissionModel.findOne.mockResolvedValue(null);

      const dto = {
        name: 'users:read',
        description: 'Read users',
        module: 'users',
        action: 'read',
      };

      const result = await service.create(dto);

      expect(mockPermissionModel.findOne).toHaveBeenCalledWith({
        name: 'users:read',
        isDeleted: false,
      });
      expect(result).toHaveProperty('_id', 'perm-1');
      expect(result.name).toBe('users:read');
    });

    it('should throw BadRequestException if permission name exists', async () => {
      mockPermissionModel.findOne.mockResolvedValue({ _id: 'existing-perm', name: 'users:read' });

      const dto = {
        name: 'users:read',
        description: 'Read users',
        module: 'users',
        action: 'read',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted permissions sorted', async () => {
      const mockList = [{ _id: 'p1', name: 'p1' }, { _id: 'p2', name: 'p2' }];
      mockPermissionModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockList),
        }),
      });

      const result = await service.findAll();

      expect(mockPermissionModel.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual(mockList);
    });
  });

  describe('findById', () => {
    it('should return permission by id', async () => {
      const mockPerm = { _id: 'p1', name: 'users:read' };
      mockPermissionModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPerm),
      });

      const result = await service.findById('p1');

      expect(mockPermissionModel.findOne).toHaveBeenCalledWith({ _id: 'p1', isDeleted: false });
      expect(result).toEqual(mockPerm);
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockPermissionModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update permission successfully', async () => {
      mockPermissionModel.findOne.mockResolvedValue(null);
      const updatedPerm = { _id: 'p1', name: 'users:write', description: 'Updated' };
      mockPermissionModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedPerm),
      });

      const result = await service.update('p1', { name: 'users:write' });

      expect(result).toEqual(updatedPerm);
    });

    it('should throw BadRequestException if new name already exists on another permission', async () => {
      mockPermissionModel.findOne.mockResolvedValue({ _id: 'other-perm', name: 'users:write' });

      await expect(service.update('p1', { name: 'users:write' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if permission to update does not exist', async () => {
      mockPermissionModel.findOne.mockResolvedValue(null);
      mockPermissionModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.update('non-existent', { description: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete permission', async () => {
      mockPermissionModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: 'p1', isDeleted: true }),
      });

      const result = await service.remove('p1');

      expect(mockPermissionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'p1', isDeleted: false },
        expect.objectContaining({
          $set: expect.objectContaining({ isDeleted: true }),
        }),
        { new: true },
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if permission not found for delete', async () => {
      mockPermissionModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.remove('p999')).rejects.toThrow(NotFoundException);
    });
  });
});
