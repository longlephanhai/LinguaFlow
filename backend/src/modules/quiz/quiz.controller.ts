import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { QuizService } from './quiz.service.js';
import { GenerateQuizDto } from './dto/generate-quiz.dto.js';
import { AnswerQuizDto } from './dto/answer-quiz.dto.js';
import { QuizHistoryQueryDto } from './dto/quiz-history-query.dto.js';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateQuizDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.quizService.generate(userId, dto);
  }

  @Post(':id/answer')
  async answer(
    @Param('id') id: string,
    @Body() dto: AnswerQuizDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id || user.sub;
    return this.quizService.answer(userId, id, dto);
  }

  @Get('history')
  async getHistory(@Query() query: QuizHistoryQueryDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.quizService.getHistory(userId, query);
  }

  @Get(':id/result')
  async getResult(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.quizService.getResult(userId, id);
  }
}
