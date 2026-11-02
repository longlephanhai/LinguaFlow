import { api } from './api';

export interface VocabularyItem {
  id: string;
  lemma: string;
  partOfSpeech: string | null;
  meaningsCount: number;
  occurrencesCount: number;
  createdAt: string;
}

export interface VocabularyListResponse {
  items: VocabularyItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OccurrenceItem {
  id: string;
  sentence: string;
  selectedText: string;
  sourceUrl: string;
  sourceTitle: string | null;
  meaning: string;
  definition: string;
  example: string;
  capturedAt: string;
  review?: {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    dueDate: string;
    suspended: boolean;
  };
}

export interface MediaMetadataPayload {
  provider?: 'youtube' | 'netflix' | 'web';
  videoId?: string;
  timestampSeconds?: number;
  videoTitle?: string;
  audioSnippetUrl?: string;
}

export interface SaveOccurrencePayload {
  lemma: string;
  meaning: string;
  example?: string;
  sentence: string;
  sourceUrl: string;
  sourceTitle?: string;
  partOfSpeech?: string;
  selectedText?: string;
  mediaMetadata?: MediaMetadataPayload;
}

export const vocabularyApi = {
  getVocabularyList: async (params?: { page?: number; limit?: number; search?: string }): Promise<VocabularyListResponse> => {
    return api.get('/vocabulary', { params }) as unknown as Promise<VocabularyListResponse>;
  },

  getOccurrences: async (itemId: string): Promise<{ occurrences: OccurrenceItem[] }> => {
    return api.get(`/vocabulary/${itemId}/occurrences`) as unknown as Promise<{ occurrences: OccurrenceItem[] }>;
  },

  saveOccurrence: async (payload: SaveOccurrencePayload): Promise<{ occurrenceId: string; vocabularyItemId: string; meaningId: string }> => {
    return api.post('/vocabulary/occurrences', payload) as unknown as Promise<{ occurrenceId: string; vocabularyItemId: string; meaningId: string }>;
  },

  updateOccurrence: async (id: string, payload: { sentence?: string; meaning?: string; example?: string }): Promise<{ success: boolean }> => {
    return api.patch(`/vocabulary/occurrences/${id}`, payload) as unknown as Promise<{ success: boolean }>;
  },

  deleteOccurrence: async (id: string): Promise<{ success: boolean }> => {
    return api.delete(`/vocabulary/occurrences/${id}`) as unknown as Promise<{ success: boolean }>;
  },

  deleteVocabularyItem: async (id: string): Promise<{ success: boolean }> => {
    return api.delete(`/vocabulary/${id}`) as unknown as Promise<{ success: boolean }>;
  },

  lookupInContext: async (
    selectedText: string,
    contextText: string,
  ): Promise<{ lemma: string; meaning: string; example: string; partOfSpeech?: string | null; cached?: boolean }> => {
    return api.post('/vocabulary/lookup', { selectedText, contextText }) as unknown as Promise<{
      lemma: string;
      meaning: string;
      example: string;
      partOfSpeech?: string | null;
      cached?: boolean;
    }>;
  },
};
