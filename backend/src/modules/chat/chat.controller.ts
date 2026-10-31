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
import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { ChatSessionsQueryDto } from './dto/chat-sessions-query.dto.js';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.chatService.sendMessage(userId, dto);
  }

  @Get('sessions')
  async getSessions(@Query() query: ChatSessionsQueryDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.chatService.getSessions(userId, query);
  }

  @Get('suggested-words')
  async getSuggestedWords(@CurrentUser() user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.chatService.getSuggestedWords(userId);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.chatService.getSession(userId, id);
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.chatService.deleteSession(userId, id);
  }
}
