import { Injectable } from '@nestjs/common';

// TODO: Delegate quiz generation to AiModule.generateQuiz()
// Mock AiModule in tests — never call real Gemini API in automated tests (PROJECT-RULES.md)
@Injectable()
export class QuizService {}
