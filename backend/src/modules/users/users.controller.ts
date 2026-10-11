import { Controller, Get, Param, NotFoundException, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
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
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, ...result } = user.toObject();
    
    return result;
  }

  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userObj = user.toObject();
    const updatedUser = await this.usersService.update(id, {
      settings: {
        ...userObj.settings,
        ...updateSettingsDto,
      },
    });

    const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, ...result } = updatedUser.toObject();
    
    return result;
  }
}
