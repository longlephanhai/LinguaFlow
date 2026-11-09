import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentRecord, DocumentRecordSchema } from './schemas/document.schema.js';
import { ReaderController } from './reader.controller.js';
import { ReaderService } from './reader.service.js';
import { AiModule } from '../ai/ai.module.js';
import { VocabularyModule } from '../vocabulary/vocabulary.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentRecord.name, schema: DocumentRecordSchema },
    ]),
    AiModule,
    VocabularyModule,
  ],
  controllers: [ReaderController],
  providers: [ReaderService],
  exports: [ReaderService],
})
export class ReaderModule {}
