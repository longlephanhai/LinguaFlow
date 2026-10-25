import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiCache, AiCacheSchema } from './schemas/ai-cache.schema.js';
import { GeminiProvider } from './gemini.provider.js';
import { AI_PROVIDER_TOKEN } from './ai-provider.interface.js';
import { AiService } from './ai.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiCache.name, schema: AiCacheSchema }]),
  ],
  providers: [
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: GeminiProvider,
    },
    AiService,
  ],
  exports: [AiService, AI_PROVIDER_TOKEN, MongooseModule],
})
export class AiModule {}
