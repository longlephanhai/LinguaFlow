import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VocabularyController } from './vocabulary.controller.js';
import { VocabularyService } from './vocabulary.service.js';
import {
  VocabularyItem,
  VocabularyItemSchema,
} from './schemas/vocabulary-item.schema.js';
import { Meaning, MeaningSchema } from './schemas/meaning.schema.js';
import {
  Occurrence,
  OccurrenceSchema,
} from './schemas/occurrence.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VocabularyItem.name, schema: VocabularyItemSchema },
      { name: Meaning.name, schema: MeaningSchema },
      { name: Occurrence.name, schema: OccurrenceSchema },
    ]),
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
