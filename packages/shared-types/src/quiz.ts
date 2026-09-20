// Quiz DTOs — AI-generated quizzes via AiModule
// Gemini is never called directly from frontend

export interface GenerateQuizDto {
  occurrenceIds: string[];
  count: number;
}

export interface QuizOptionDto {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionDto {
  id: string;
  question: string;
  options: QuizOptionDto[];
  occurrenceId: string;
}

export interface QuizAnswerDto {
  questionId: string;
  selectedOptionIndex: number;
}

export interface QuizResultDto {
  score: number;
  total: number;
  details: Array<{ questionId: string; correct: boolean }>;
}
