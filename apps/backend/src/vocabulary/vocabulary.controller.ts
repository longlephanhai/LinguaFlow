import { Controller } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';

// TODO: Implement POST /vocabulary/lookup, POST /vocabulary/occurrences
// See docs/API-CONTRACTS.md for full contract
// All AI calls go through AiModule — never import Gemini SDK here (see PROJECT-RULES.md)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}
}
