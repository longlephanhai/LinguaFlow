import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';

describe('RolesController', () => {
  let controller: RolesController;
  let mockRolesService: Partial<Record<keyof RolesService, any>>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRolesService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    controller = new RolesController(mockRolesService as RolesService);
  });

  it('should create a role', async () => {
    const dto = {
      name: 'moderator',
      description: 'Moderator role',
      permissions: ['507f1f77bcf86cd799439011'],
    };
    mockRolesService.create.mockResolvedValue({ _id: 'role-1', ...dto });

    const result = await controller.create(dto);
    expect(mockRolesService.create).toHaveBeenCalledWith(dto);
    expect(result).toHaveProperty('_id', 'role-1');
  });

  it('should find all roles', async () => {
    const list = [{ _id: 'r1', name: 'admin' }];
    mockRolesService.findAll.mockResolvedValue(list);

    const result = await controller.findAll();
    expect(mockRolesService.findAll).toHaveBeenCalled();
    expect(result).toEqual(list);
  });

  it('should find one role', async () => {
    const role = { _id: 'r1', name: 'admin' };
    mockRolesService.findById.mockResolvedValue(role);

    const result = await controller.findOne('r1');
    expect(mockRolesService.findById).toHaveBeenCalledWith('r1');
    expect(result).toEqual(role);
  });

  it('should update a role', async () => {
    const updateDto = { description: 'Updated description' };
    mockRolesService.update.mockResolvedValue({ _id: 'r1', ...updateDto });

    const result = await controller.update('r1', updateDto);
    expect(mockRolesService.update).toHaveBeenCalledWith('r1', updateDto);
    expect(result.description).toBe('Updated description');
  });

  it('should remove a role', async () => {
    mockRolesService.remove.mockResolvedValue({ success: true });

    const result = await controller.remove('r1');
    expect(mockRolesService.remove).toHaveBeenCalledWith('r1');
    expect(result).toEqual({ success: true });
  });
});
