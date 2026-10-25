import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewController } from './review.controller.js';
import { ReviewService } from './review.service.js';
import { Occurrence, OccurrenceSchema } from '../vocabulary/schemas/occurrence.schema.js';
import { VocabularyItem, VocabularyItemSchema } from '../vocabulary/schemas/vocabulary-item.schema.js';
import { Meaning, MeaningSchema } from '../vocabulary/schemas/meaning.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Occurrence.name, schema: OccurrenceSchema },
      { name: VocabularyItem.name, schema: VocabularyItemSchema },
      { name: Meaning.name, schema: MeaningSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
