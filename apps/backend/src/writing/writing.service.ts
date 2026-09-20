import { Injectable } from '@nestjs/common';

// TODO: Delegate writing review to AiModule.reviewWriting()
// Mock AiModule in tests — never call real Gemini API in automated tests (PROJECT-RULES.md)
@Injectable()
export class WritingService {}
