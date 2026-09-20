import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

// AiModule is the ONLY module allowed to import the Gemini SDK.
// All other modules (Vocabulary, Quiz, Chat, Writing) must inject AiService.
// See ARCHITECTURE.md §6 and PROJECT-RULES.md.
@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
