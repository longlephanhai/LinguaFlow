import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VocabularyController } from './vocabulary.controller.js';
import { VocabularyService } from './vocabulary.service.js';
import {
  VocabularyItem,
  VocabularyItemSchema,
} from './schemas/vocabulary-item.schema.js';
import { Meaning, MeaningSchema } from './schemas/meaning.schema.js';
import { Occurrence, OccurrenceSchema } from './schemas/occurrence.schema.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VocabularyItem.name, schema: VocabularyItemSchema },
      { name: Meaning.name, schema: MeaningSchema },
      { name: Occurrence.name, schema: OccurrenceSchema },
    ]),
    AiModule,
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
