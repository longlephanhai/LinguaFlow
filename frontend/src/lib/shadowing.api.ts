import { api } from './api';

export interface WordEvaluation {
  word: string;
  status: 'correct' | 'minor_error' | 'mispronounced' | 'omitted';
  phonemeFeedback: string | null;
}

export interface EvaluateShadowingPayload {
  targetText: string;
  userTranscript?: string;
  userAudioBase64?: string;
  videoId?: string;
  segmentIndex?: number;
}

export interface EvaluateShadowingResponse {
  overallScore: number;
  transcribedText: string;
  wordsEvaluation: WordEvaluation[];
  generalTips: string;
}

export const shadowingApi = {
  evaluateShadowing: async (
    payload: EvaluateShadowingPayload,
  ): Promise<EvaluateShadowingResponse> => {
    return api.post('/shadowing/evaluate', payload) as unknown as Promise<EvaluateShadowingResponse>;
  },
};
