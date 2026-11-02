import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DictationService } from './dictation.service.js';
import { RecordDictationSessionDto } from './dto/record-dictation-session.dto.js';

@Controller('dictation')
@UseGuards(JwtAuthGuard)
export class DictationController {
  constructor(private readonly dictationService: DictationService) {}

  @Post('sessions')
  async recordSession(
    @CurrentUser() user: any,
    @Body() dto: RecordDictationSessionDto,
  ) {
    const userId = user.userId || user.id || user.sub;
    return this.dictationService.recordSession(userId, dto);
  }
}
