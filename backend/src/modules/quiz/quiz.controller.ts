import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { QuizService } from './quiz.service.js';
import { GenerateQuizDto } from './dto/generate-quiz.dto.js';
import { AnswerQuizDto } from './dto/answer-quiz.dto.js';
import { QuizHistoryQueryDto } from './dto/quiz-history-query.dto.js';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateQuizDto, @Request() req: any) {
    const userId = req.user.id || req.user.sub || req.user._id;
    return this.quizService.generate(userId, dto);
  }

  @Post(':id/answer')
  async answer(
    @Param('id') id: string,
    @Body() dto: AnswerQuizDto,
    @Request() req: any,
  ) {
    const userId = req.user.id || req.user.sub || req.user._id;
    return this.quizService.answer(userId, id, dto);
  }

  @Get('history')
  async getHistory(@Query() query: QuizHistoryQueryDto, @Request() req: any) {
    const userId = req.user.id || req.user.sub || req.user._id;
    return this.quizService.getHistory(userId, query);
  }

  @Get(':id/result')
  async getResult(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id || req.user.sub || req.user._id;
    return this.quizService.getResult(userId, id);
  }
}
