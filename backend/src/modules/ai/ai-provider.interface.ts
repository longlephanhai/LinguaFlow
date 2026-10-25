export interface ExplainInContextResult {
  lemma: string;
  meaning: string;
  example: string;
  partOfSpeech?: string;
}

export interface AIProvider {
  explainInContext(selectedText: string, contextText: string): Promise<ExplainInContextResult>;
}

export const AI_PROVIDER_TOKEN = Symbol('AI_PROVIDER_TOKEN');
