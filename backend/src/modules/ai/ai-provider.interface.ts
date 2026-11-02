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

export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface WritingReviewResult {
  feedback: string;
  suggestions: string[];
  aiModel?: string;
}

export interface WordSpeechEvaluation {
  word: string;
  status: 'correct' | 'minor_error' | 'mispronounced' | 'omitted';
  phonemeFeedback: string | null;
}

export interface SpeechEvaluationResult {
  overallScore: number;
  transcribedText: string;
  wordsEvaluation: WordSpeechEvaluation[];
  generalTips: string;
}

export interface AIProvider {
  explainInContext(selectedText: string, contextText: string): Promise<ExplainInContextResult>;
  generateQuiz(items: QuizItemInput[], count: number): Promise<GeneratedQuestion[]>;
  chat(history: ChatMessageItem[], message: string, userVocabulary?: string[]): Promise<string>;
  reviewWriting(text: string): Promise<WritingReviewResult>;
  evaluateSpeech(
    targetText: string,
    userTranscript: string,
    userAudioBase64?: string,
  ): Promise<SpeechEvaluationResult>;
}

export const AI_PROVIDER_TOKEN = Symbol('AI_PROVIDER_TOKEN');

