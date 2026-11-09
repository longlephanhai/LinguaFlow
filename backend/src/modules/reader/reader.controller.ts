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
import { ReaderService } from './reader.service.js';
import { ParseArticleDto } from './dto/parse-article.dto.js';
import { BatchSaveReaderDto } from './dto/batch-save-reader.dto.js';
import { QueryArticlesDto } from './dto/query-articles.dto.js';

@Controller('reader')
@UseGuards(JwtAuthGuard)
export class ReaderController {
  constructor(private readonly readerService: ReaderService) {}

  @Post('parse')
  async parseArticle(@Body() dto: ParseArticleDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.readerService.parseArticle(dto, userId);
  }

  @Get('articles')
  async getArticles(@Query() query: QueryArticlesDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.readerService.getArticles(userId, query);
  }

  @Get('articles/:id')
  async getArticleById(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.readerService.getArticleById(id, userId);
  }

  @Delete('articles/:id')
  async deleteArticle(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.readerService.deleteArticle(id, userId);
  }

  @Post('batch-save')
  async batchSaveVocabulary(@Body() dto: BatchSaveReaderDto, @CurrentUser() user: any) {
    const userId = user.userId || user.id || user._id;
    return this.readerService.batchSaveVocabulary(dto, userId);
  }
}

