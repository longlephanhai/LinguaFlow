import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const displayName = registerDto.displayName || registerDto.email.split('@')[0];

    const newUser = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      displayName,
    });

    const tokens = await this.generateTokens(newUser._id.toString(), newUser.email);
    await this.updateRefreshTokenHash(newUser._id.toString(), tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        displayName: newUser.displayName,
        avatarUrl: newUser.avatarUrl,
        settings: newUser.settings,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email);
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        settings: user.settings,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'linguaflow-super-secret-jwt-refresh-key',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = this.jwtService.sign(
      { sub: user._id.toString(), email: user.email },
      {
        secret: this.configService.get<string>('JWT_SECRET') || 'linguaflow-super-secret-jwt-key',
        expiresIn: (this.configService.get<string>('JWT_EXPIRATION') || '15m') as any,
      },
    );

    return { accessToken };
  }

  async logout(userId: string) {
    await this.usersService.update(userId, { refreshTokenHash: null });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let roleName = 'user';
    let permissions: string[] = [];

    if (user.roleId) {
      const populatedRole = user.roleId as any;
      if (populatedRole && typeof populatedRole === 'object' && populatedRole.name) {
        roleName = populatedRole.name;
        if (Array.isArray(populatedRole.permissions)) {
          permissions = populatedRole.permissions
            .filter((p: any) => p && !p.isDeleted && p.name)
            .map((p: any) => p.name);
        }
      }
    }

    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: roleName,
      permissions,
      settings: user.settings,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'linguaflow-super-secret-jwt-key',
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') || '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'linguaflow-super-secret-jwt-refresh-key',
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshTokenHash: hash });
  }
}
