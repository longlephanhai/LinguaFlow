import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from './schemas/role.schema.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { PermissionsService } from '../permissions/permissions.service.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleModel.findOne({
      name: createRoleDto.name,
      isDeleted: false,
    });
    if (existing) {
      throw new BadRequestException('Role name already exists');
    }

    if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
      const validPermissions = await this.permissionsService.findByIds(
        createRoleDto.permissions,
      );
      if (validPermissions.length !== createRoleDto.permissions.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
    }

    const permissionObjectIds = createRoleDto.permissions
      ? createRoleDto.permissions.map((id) => new Types.ObjectId(id))
      : [];

    const role = new this.roleModel({
      ...createRoleDto,
      permissions: permissionObjectIds,
    });
    return (await role.save()).populate({
      path: 'permissions',
      match: { isDeleted: false },
    });
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel
      .find({ isDeleted: false })
      .populate({
        path: 'permissions',
        match: { isDeleted: false },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleModel
      .findOne({ _id: id, isDeleted: false })
      .populate({
        path: 'permissions',
        match: { isDeleted: false },
      })
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleModel
      .findOne({ name, isDeleted: false })
      .populate({
        path: 'permissions',
        match: { isDeleted: false },
      })
      .exec();
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    if (updateRoleDto.name) {
      const existing = await this.roleModel.findOne({
        name: updateRoleDto.name,
        _id: { $ne: id },
        isDeleted: false,
      });
      if (existing) {
        throw new BadRequestException('Role name already exists');
      }
    }

    if (updateRoleDto.permissions && updateRoleDto.permissions.length > 0) {
      const validPermissions = await this.permissionsService.findByIds(
        updateRoleDto.permissions,
      );
      if (validPermissions.length !== updateRoleDto.permissions.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
    }

    const updatePayload: any = { ...updateRoleDto };
    if (updateRoleDto.permissions) {
      updatePayload.permissions = updateRoleDto.permissions.map(
        (permId) => new Types.ObjectId(permId),
      );
    }

    const updated = await this.roleModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updatePayload },
        { new: true },
      )
      .populate({
        path: 'permissions',
        match: { isDeleted: false },
      })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const deleted = await this.roleModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!deleted) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return { success: true };
  }
}
