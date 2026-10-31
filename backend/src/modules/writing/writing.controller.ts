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
import { WritingService } from './writing.service.js';
import { SubmitWritingDto } from './dto/submit-writing.dto.js';
import { WritingHistoryQueryDto } from './dto/writing-history-query.dto.js';

@Controller('writing')
@UseGuards(JwtAuthGuard)
export class WritingController {
  constructor(private readonly writingService: WritingService) {}

  @Post('review')
  async reviewWriting(
    @Body() dto: SubmitWritingDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id || user.sub;
    return this.writingService.reviewWriting(userId, dto);
  }

  @Get('history')
  async getHistory(
    @Query() query: WritingHistoryQueryDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id || user.sub;
    return this.writingService.getHistory(userId, query);
  }

  @Get('suggested-words')
  async getSuggestedWords(@CurrentUser() user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.writingService.getSuggestedWords(userId);
  }

  @Get('history/:id')
  async getReviewById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id || user.sub;
    return this.writingService.getReviewById(userId, id);
  }

  @Delete('history/:id')
  async deleteReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id || user.sub;
    return this.writingService.deleteReview(userId, id);
  }
}
