import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DictationController } from './dictation.controller.js';
import { DictationService } from './dictation.service.js';
import {
  DictationSession,
  DictationSessionSchema,
} from './schemas/dictation-session.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DictationSession.name, schema: DictationSessionSchema },
    ]),
  ],
  controllers: [DictationController],
  providers: [DictationService],
  exports: [DictationService],
})
export class DictationModule {}
