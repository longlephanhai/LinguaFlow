import { Controller } from '@nestjs/common';
import { WritingService } from './writing.service';

// TODO: Implement POST /writing/review
// All AI calls go through AiModule — never import Gemini SDK here (see PROJECT-RULES.md)
@Controller('writing')
export class WritingController {
  constructor(private readonly writingService: WritingService) {}
}
