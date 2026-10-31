import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { Occurrence, OccurrenceSchema } from '../vocabulary/schemas/occurrence.schema.js';
import { VocabularyItem, VocabularyItemSchema } from '../vocabulary/schemas/vocabulary-item.schema.js';
import { QuizResult, QuizResultSchema } from '../quiz/schemas/quiz-result.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Occurrence.name, schema: OccurrenceSchema },
      { name: VocabularyItem.name, schema: VocabularyItemSchema },
      { name: QuizResult.name, schema: QuizResultSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
