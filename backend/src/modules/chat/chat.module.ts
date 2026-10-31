import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSession, ChatSessionSchema } from './schemas/chat-session.schema.js';
import { AiModule } from '../ai/ai.module.js';
import { VocabularyModule } from '../vocabulary/vocabulary.module.js';
import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
    ]),
    AiModule,
    VocabularyModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
