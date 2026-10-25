import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { VocabularyService } from './vocabulary.service.js';
import { SaveOccurrenceDto } from './dto/save-occurrence.dto.js';
import { QueryVocabularyDto } from './dto/query-vocabulary.dto.js';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto.js';

@Controller('vocabulary')
@UseGuards(JwtAuthGuard)
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Post('occurrences')
  async saveOccurrence(
    @Body() dto: SaveOccurrenceDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id;
    return this.vocabularyService.saveOccurrence(dto, userId);
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query() query: QueryVocabularyDto,
  ) {
    const userId = user.userId || user.id;
    return this.vocabularyService.findAll(userId, query);
  }

  @Get(':itemId/occurrences')
  async findOccurrences(
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id;
    return this.vocabularyService.findOccurrences(userId, itemId);
  }

  @Patch('occurrences/:id')
  async updateOccurrence(
    @Param('id') id: string,
    @Body() dto: UpdateOccurrenceDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id;
    return this.vocabularyService.updateOccurrence(userId, id, dto);
  }

  @Delete('occurrences/:id')
  async deleteOccurrence(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id;
    return this.vocabularyService.deleteOccurrence(userId, id);
  }

  @Delete(':id')
  async deleteVocabularyItem(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id;
    return this.vocabularyService.deleteVocabularyItem(userId, id);
  }
}
