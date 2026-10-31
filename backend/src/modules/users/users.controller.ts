import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUser(
    @Param('id') id: string,
    @CurrentUser('userId') currentUserId?: string,
  ) {
    const targetId = id === 'me' ? currentUserId : id;
    const user = await this.usersService.findById(targetId!);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Do not return passwordHash and refreshTokenHash
    const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, ...result } = user.toObject();
    
    return result;
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('userId') currentUserId?: string,
  ) {
    const targetId = id === 'me' ? currentUserId : id;
    const updatePayload: any = { ...updateUserDto };
    if (updateUserDto.roleId) {
      updatePayload.roleId = new Types.ObjectId(updateUserDto.roleId);
    }

    const user = await this.usersService.update(targetId!, updatePayload);
    const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, ...result } = user.toObject();
    
    return result;
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentUser('userId') currentUserId?: string,
  ) {
    const targetId = id === 'me' ? currentUserId : id;
    const user = await this.usersService.update(targetId!, {
      roleId: new Types.ObjectId(updateUserRoleDto.roleId) as any,
    });
    const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, ...result } = user.toObject();
    
    return result;
  }

  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
    @CurrentUser('userId') currentUserId?: string,
  ) {
    const targetId = id === 'me' ? currentUserId : id;
    const user = await this.usersService.findById(targetId!);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userObj = user.toObject();
    const updatedUser = await this.usersService.update(targetId!, {
      settings: {
        ...userObj.settings,
        ...updateSettingsDto,
      },
    });

    const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, ...result } = updatedUser.toObject();
    
    return result;
  }
}

