import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WritingReview, WritingReviewSchema } from './schemas/writing-review.schema.js';
import { WritingService } from './writing.service.js';
import { WritingController } from './writing.controller.js';
import { AiModule } from '../ai/ai.module.js';
import { VocabularyModule } from '../vocabulary/vocabulary.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WritingReview.name, schema: WritingReviewSchema },
    ]),
    AiModule,
    VocabularyModule,
  ],
  controllers: [WritingController],
  providers: [WritingService],
  exports: [WritingService],
})
export class WritingModule {}
