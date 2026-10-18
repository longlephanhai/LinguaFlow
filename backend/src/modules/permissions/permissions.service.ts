import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from './schemas/permission.schema.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const existing = await this.permissionModel.findOne({
      name: createPermissionDto.name,
      isDeleted: false,
    });
    if (existing) {
      throw new BadRequestException('Permission name already exists');
    }

    const permission = new this.permissionModel(createPermissionDto);
    return permission.save();
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionModel
      .find({ isDeleted: false })
      .sort({ module: 1, name: 1 })
      .exec();
  }

  async findById(id: string): Promise<Permission> {
    const permission = await this.permissionModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.permissionModel.findOne({ name, isDeleted: false }).exec();
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    return this.permissionModel
      .find({ _id: { $in: ids }, isDeleted: false })
      .exec();
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    if (updatePermissionDto.name) {
      const existing = await this.permissionModel.findOne({
        name: updatePermissionDto.name,
        _id: { $ne: id },
        isDeleted: false,
      });
      if (existing) {
        throw new BadRequestException('Permission name already exists');
      }
    }

    const updated = await this.permissionModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updatePermissionDto },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const deleted = await this.permissionModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!deleted) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return { success: true };
  }
}
