import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service.js';

describe('RolesService', () => {
  let service: RolesService;
  let mockRoleModel: any;
  let mockPermissionsService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRoleModel = vi.fn().mockImplementation(function (this: any, dto: any) {
      Object.assign(this, dto);
      this.save = vi.fn().mockResolvedValue({
        _id: 'role-1',
        ...dto,
        populate: vi.fn().mockResolvedValue({ _id: 'role-1', ...dto }),
      });
    });

    mockRoleModel.find = vi.fn();
    mockRoleModel.findOne = vi.fn();
    mockRoleModel.findOneAndUpdate = vi.fn();

    mockPermissionsService = {
      findByIds: vi.fn(),
    };

    service = new RolesService(mockRoleModel as any, mockPermissionsService);
  });

  describe('create', () => {
    it('should create and return role without permissions', async () => {
      mockRoleModel.findOne.mockResolvedValue(null);

      const dto = {
        name: 'editor',
        description: 'Editor role',
      };

      const result = await service.create(dto);

      expect(mockRoleModel.findOne).toHaveBeenCalledWith({
        name: 'editor',
        isDeleted: false,
      });
      expect(result).toHaveProperty('_id', 'role-1');
      expect(result.name).toBe('editor');
    });

    it('should validate permissions and create role when permission IDs are valid', async () => {
      mockRoleModel.findOne.mockResolvedValue(null);
      mockPermissionsService.findByIds.mockResolvedValue([
        { _id: '507f1f77bcf86cd799439011', name: 'users:read' },
      ]);

      const dto = {
        name: 'viewer',
        description: 'Viewer role',
        permissions: ['507f1f77bcf86cd799439011'],
      };

      const result = await service.create(dto);

      expect(mockPermissionsService.findByIds).toHaveBeenCalledWith(['507f1f77bcf86cd799439011']);
      expect(result).toHaveProperty('_id', 'role-1');
    });

    it('should throw BadRequestException if one or more permission IDs are invalid', async () => {
      mockRoleModel.findOne.mockResolvedValue(null);
      mockPermissionsService.findByIds.mockResolvedValue([]); // none found

      const dto = {
        name: 'viewer',
        description: 'Viewer role',
        permissions: ['507f1f77bcf86cd799439011'],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if role name already exists', async () => {
      mockRoleModel.findOne.mockResolvedValue({ _id: 'existing', name: 'admin' });

      const dto = {
        name: 'admin',
        description: 'Duplicate admin',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted roles populated', async () => {
      const mockRoles = [{ _id: 'r1', name: 'admin' }];
      mockRoleModel.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockRoles),
          }),
        }),
      });

      const result = await service.findAll();

      expect(mockRoleModel.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual(mockRoles);
    });
  });

  describe('findById', () => {
    it('should return role by id', async () => {
      const mockRole = { _id: 'r1', name: 'admin' };
      mockRoleModel.findOne.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockRole),
        }),
      });

      const result = await service.findById('r1');

      expect(mockRoleModel.findOne).toHaveBeenCalledWith({ _id: 'r1', isDeleted: false });
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      mockRoleModel.findOne.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findById('r999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update role successfully', async () => {
      mockRoleModel.findOne.mockResolvedValue(null);
      const updatedRole = { _id: 'r1', name: 'admin-updated' };
      mockRoleModel.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(updatedRole),
        }),
      });

      const result = await service.update('r1', { name: 'admin-updated' });

      expect(result).toEqual(updatedRole);
    });

    it('should throw BadRequestException if new name already taken by another role', async () => {
      mockRoleModel.findOne.mockResolvedValue({ _id: 'r2', name: 'admin' });

      await expect(service.update('r1', { name: 'admin' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if role to update does not exist', async () => {
      mockRoleModel.findOne.mockResolvedValue(null);
      mockRoleModel.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.update('r999', { description: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete role', async () => {
      mockRoleModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: 'r1', isDeleted: true }),
      });

      const result = await service.remove('r1');

      expect(mockRoleModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'r1', isDeleted: false },
        expect.objectContaining({
          $set: expect.objectContaining({ isDeleted: true }),
        }),
        { new: true },
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if role not found for delete', async () => {
      mockRoleModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.remove('r999')).rejects.toThrow(NotFoundException);
    });
  });
});
