export interface ExplainInContextResult {
  lemma: string;
  meaning: string;
  example: string;
  partOfSpeech?: string;
}

export interface QuizItemInput {
  occurrenceId: string;
  selectedText: string;
  sentence: string;
  lemma: string;
  meaning: string;
}

export interface GeneratedQuestion {
  occurrenceId: string;
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface AIProvider {
  explainInContext(selectedText: string, contextText: string): Promise<ExplainInContextResult>;
  generateQuiz(items: QuizItemInput[], count: number): Promise<GeneratedQuestion[]>;
}

export const AI_PROVIDER_TOKEN = Symbol('AI_PROVIDER_TOKEN');
