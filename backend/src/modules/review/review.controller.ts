import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ReviewService } from './review.service.js';
import { ReviewResultDto } from './dto/review-result.dto.js';
import { SuspendCardDto } from './dto/suspend-card.dto.js';

@Controller('review')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('due')
  async getDueOccurrences(@CurrentUser() user: any) {
    const userId = user.userId || user.id;
    return this.reviewService.getDueOccurrences(userId);
  }

  @Post(':occurrenceId/result')
  async recordReviewResult(
    @Param('occurrenceId') occurrenceId: string,
    @Body() dto: ReviewResultDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id;
    return this.reviewService.recordReviewResult(userId, occurrenceId, dto);
  }

  @Patch(':occurrenceId/suspend')
  async suspendCard(
    @Param('occurrenceId') occurrenceId: string,
    @Body() dto: SuspendCardDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id;
    return this.reviewService.suspendCard(userId, occurrenceId, dto);
  }
}
