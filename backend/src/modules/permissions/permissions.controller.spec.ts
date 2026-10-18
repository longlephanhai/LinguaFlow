import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionsController } from './permissions.controller.js';
import { PermissionsService } from './permissions.service.js';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let mockPermissionsService: Partial<Record<keyof PermissionsService, any>>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPermissionsService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    controller = new PermissionsController(mockPermissionsService as PermissionsService);
  });

  it('should create a permission', async () => {
    const dto = {
      name: 'users:read',
      description: 'Read users',
      module: 'users',
      action: 'read',
    };
    mockPermissionsService.create.mockResolvedValue({ _id: '1', ...dto });

    const result = await controller.create(dto);
    expect(mockPermissionsService.create).toHaveBeenCalledWith(dto);
    expect(result).toHaveProperty('_id', '1');
  });

  it('should find all permissions', async () => {
    const list = [{ _id: '1', name: 'p1' }];
    mockPermissionsService.findAll.mockResolvedValue(list);

    const result = await controller.findAll();
    expect(mockPermissionsService.findAll).toHaveBeenCalled();
    expect(result).toEqual(list);
  });

  it('should find one permission', async () => {
    const perm = { _id: '1', name: 'p1' };
    mockPermissionsService.findById.mockResolvedValue(perm);

    const result = await controller.findOne('1');
    expect(mockPermissionsService.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(perm);
  });

  it('should update a permission', async () => {
    const updateDto = { description: 'Updated' };
    mockPermissionsService.update.mockResolvedValue({ _id: '1', ...updateDto });

    const result = await controller.update('1', updateDto);
    expect(mockPermissionsService.update).toHaveBeenCalledWith('1', updateDto);
    expect(result.description).toBe('Updated');
  });

  it('should remove a permission', async () => {
    mockPermissionsService.remove.mockResolvedValue({ success: true });

    const result = await controller.remove('1');
    expect(mockPermissionsService.remove).toHaveBeenCalledWith('1');
    expect(result).toEqual({ success: true });
  });
});
