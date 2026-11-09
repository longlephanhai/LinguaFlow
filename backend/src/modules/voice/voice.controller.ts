import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { VoiceService } from './voice.service.js';
import { StartVoiceSessionDto } from './dto/start-voice-session.dto.js';
import { VoiceTurnDto } from './dto/voice-turn.dto.js';
import { EndVoiceSessionDto } from './dto/end-voice-session.dto.js';
import { QueryVoiceSessionsDto } from './dto/query-voice-sessions.dto.js';

@Controller('voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('start')
  async startSession(@Body() dto: StartVoiceSessionDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.voiceService.startSession(userId, dto);
  }

  @Post('turn')
  async handleTurn(@Body() dto: VoiceTurnDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.voiceService.handleTurn(userId, dto);
  }

  @Post('end')
  async endSession(@Body() dto: EndVoiceSessionDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.voiceService.endSession(userId, dto);
  }

  @Get('sessions')
  async getSessions(@Query() query: QueryVoiceSessionsDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.voiceService.getSessions(userId, query);
  }

  @Get('sessions/:id')
  async getSessionById(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.voiceService.getSessionById(id, userId);
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.voiceService.deleteSession(id, userId);
  }
}
