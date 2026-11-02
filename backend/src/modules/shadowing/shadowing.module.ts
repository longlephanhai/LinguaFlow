import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from '../ai/ai.module.js';
import {
  ShadowingAttempt,
  ShadowingAttemptSchema,
} from './schemas/shadowing-attempt.schema.js';
import { ShadowingController } from './shadowing.controller.js';
import { ShadowingService } from './shadowing.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShadowingAttempt.name, schema: ShadowingAttemptSchema },
    ]),
    AiModule,
  ],
  controllers: [ShadowingController],
  providers: [ShadowingService],
  exports: [ShadowingService],
})
export class ShadowingModule {}
