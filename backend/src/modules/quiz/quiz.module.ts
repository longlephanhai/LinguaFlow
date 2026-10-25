import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from './schemas/quiz.schema.js';
import { QuizResult, QuizResultSchema } from './schemas/quiz-result.schema.js';
import { Occurrence, OccurrenceSchema } from '../vocabulary/schemas/occurrence.schema.js';
import { AiModule } from '../ai/ai.module.js';
import { QuizService } from './quiz.service.js';
import { QuizController } from './quiz.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizResult.name, schema: QuizResultSchema },
      { name: Occurrence.name, schema: OccurrenceSchema },
    ]),
    AiModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
