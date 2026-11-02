import { api } from './api';

export interface RecordDictationSessionPayload {
  videoId: string;
  completedSegments: number;
  totalSegments: number;
  accuracyScore: number;
  timeSpentSeconds: number;
  mistakesCount: number;
}

export interface RecordDictationSessionResponse {
  sessionId: string;
  accuracyScore: number;
  recordedAt: string;
}

export const dictationApi = {
  recordSession: async (
    payload: RecordDictationSessionPayload,
  ): Promise<RecordDictationSessionResponse> => {
    return api.post('/dictation/sessions', payload) as unknown as Promise<RecordDictationSessionResponse>;
  },
};
