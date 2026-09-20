import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { ReviewModule } from './review/review.module';
import { QuizModule } from './quiz/quiz.module';
import { ChatModule } from './chat/chat.module';
import { WritingModule } from './writing/writing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // Config — reads .env; Gemini key NEVER hardcoded (see PROJECT-RULES.md)
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB connection
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/linguaflow'),

    // Rate limiting (tune numbers via env vars — see ARCHITECTURE.md §7)
    ThrottlerModule.forRoot([
      {
        ttl: 86400, // 1 day in seconds
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '200', 10),
      },
    ]),

    // Domain modules — one per domain (see PROJECT-RULES.md)
    AuthModule,
    VocabularyModule,
    ReviewModule,
    QuizModule,
    ChatModule,
    WritingModule,
    DashboardModule,
    AiModule,
  ],
})
export class AppModule {}
