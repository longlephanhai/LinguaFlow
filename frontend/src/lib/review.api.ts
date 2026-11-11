import { api } from './api';

export interface MediaMetadata {
  provider: 'youtube' | 'netflix' | 'web' | null;
  videoId: string | null;
  timestampSeconds: number | null;
  videoTitle: string | null;
  audioSnippetUrl?: string | null;
}

export interface DueOccurrence {
  id: string;
  occurrenceId: string;
  lemma: string;
  partOfSpeech: string | null;
  selectedText: string;
  sentence: string;
  meaning: string;
  definition: string;
  example: string;
  sourceUrl: string;
  sourceTitle: string | null;
  mediaMetadata?: MediaMetadata | null;
  review?: {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    dueDate: string;
  };
}

export interface ReviewDueResponse {
  occurrences: DueOccurrence[];
}

export interface ReviewResultResponse {
  nextDueDate: string;
  intervalDays: number;
}

export interface BatchReviewSyncItem {
  occurrenceId: string;
  remembered: boolean;
  reviewedAt?: string;
}

export interface BatchReviewSyncResultItem {
  occurrenceId: string;
  nextDueDate: string;
  intervalDays: number;
  easeFactor: number;
  repetition: number;
}

export interface BatchReviewSyncResponse {
  syncedCount: number;
  results: BatchReviewSyncResultItem[];
}

export const reviewApi = {
  getDueOccurrences: async (): Promise<ReviewDueResponse> => {
    return api.get('/review/due') as unknown as Promise<ReviewDueResponse>;
  },

  recordResult: async (occurrenceId: string, remembered: boolean): Promise<ReviewResultResponse> => {
    return api.post(`/review/${occurrenceId}/result`, { remembered }) as unknown as Promise<ReviewResultResponse>;
  },

  syncBatchReviews: async (items: BatchReviewSyncItem[]): Promise<BatchReviewSyncResponse> => {
    return api.post('/review/sync', { items }) as unknown as Promise<BatchReviewSyncResponse>;
  },

  suspendCard: async (occurrenceId: string, suspended: boolean): Promise<{ success: boolean; suspended: boolean }> => {
    return api.patch(`/review/${occurrenceId}/suspend`, { suspended }) as unknown as Promise<{ success: boolean; suspended: boolean }>;
  },
};
