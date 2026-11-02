import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { EvaluateShadowingDto } from './dto/evaluate-shadowing.dto.js';
import { ShadowingService } from './shadowing.service.js';

@Controller('shadowing')
@UseGuards(JwtAuthGuard)
export class ShadowingController {
  constructor(private readonly shadowingService: ShadowingService) {}

  @Post('evaluate')
  async evaluate(
    @CurrentUser() user: any,
    @Body() dto: EvaluateShadowingDto,
  ) {
    const userId = user.userId || user.id || user.sub;
    return this.shadowingService.evaluate(userId, dto);
  }
}

