import { Controller } from '@nestjs/common';
import { QuizService } from './quiz.service';

// TODO: Implement POST /quiz/generate, POST /quiz/submit
// All AI calls go through AiModule — never import Gemini SDK here (see PROJECT-RULES.md)
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}
}
