import { api } from './api';

export interface SubmitWritingRequest {
  text: string;
}

export interface WritingReviewResponse {
  _id: string;
  originalText: string;
  wordCount: number;
  feedback: string;
  suggestions: string[];
  aiModel?: string;
  createdAt: string;
}

export interface WritingHistoryItem {
  _id: string;
  originalText: string;
  wordCount: number;
  suggestionsCount: number;
  createdAt: string;
}

export interface WritingHistoryResponse {
  items: WritingHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const writingApi = {
  submitReview: async (data: SubmitWritingRequest): Promise<WritingReviewResponse> => {
    return api.post('/writing/review', data) as unknown as Promise<WritingReviewResponse>;
  },

  getHistory: async (page = 1, limit = 10): Promise<WritingHistoryResponse> => {
    return api.get(`/writing/history?page=${page}&limit=${limit}`) as unknown as Promise<WritingHistoryResponse>;
  },

  getReviewById: async (id: string): Promise<WritingReviewResponse> => {
    return api.get(`/writing/history/${id}`) as unknown as Promise<WritingReviewResponse>;
  },

  deleteReview: async (id: string): Promise<{ success: boolean }> => {
    return api.delete(`/writing/history/${id}`) as unknown as Promise<{ success: boolean }>;
  },

  getSuggestedWords: async (): Promise<{ words: string[] }> => {
    return api.get('/writing/suggested-words') as unknown as Promise<{ words: string[] }>;
  },
};
