import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VoiceSession, VoiceSessionSchema } from './schemas/voice-session.schema.js';
import { VocabularyItem, VocabularyItemSchema } from '../vocabulary/schemas/vocabulary-item.schema.js';
import { VoiceController } from './voice.controller.js';
import { VoiceService } from './voice.service.js';
import { ReviewModule } from '../review/review.module.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VoiceSession.name, schema: VoiceSessionSchema },
      { name: VocabularyItem.name, schema: VocabularyItemSchema },
    ]),
    ReviewModule,
    AiModule,
  ],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}

