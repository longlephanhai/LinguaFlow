import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'linguaflow-super-secret-jwt-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
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
      userId: payload.sub,
      email: payload.email,
      role: roleName,
      permissions,
    };
  }
}
