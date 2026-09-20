import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';

// TODO: Implement POST /auth/register, POST /auth/login, POST /auth/refresh
// See docs/API-CONTRACTS.md for full contract
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
}
