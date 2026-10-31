import { api } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SendMessageRequest {
  sessionId?: string;
  message: string;
}

export interface SendMessageResponse {
  sessionId: string;
  reply: string;
}

export interface ChatSessionListItem {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionsResponse {
  items: ChatSessionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatSessionDetailResponse {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedWordsResponse {
  words: string[];
}

export const chatApi = {
  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    return api.post('/chat/message', data) as unknown as Promise<SendMessageResponse>;
  },

  getSessions: async (page = 1, limit = 20): Promise<ChatSessionsResponse> => {
    return api.get(`/chat/sessions?page=${page}&limit=${limit}`) as unknown as Promise<ChatSessionsResponse>;
  },

  getSession: async (id: string): Promise<ChatSessionDetailResponse> => {
    return api.get(`/chat/sessions/${id}`) as unknown as Promise<ChatSessionDetailResponse>;
  },

  deleteSession: async (id: string): Promise<{ success: boolean }> => {
    return api.delete(`/chat/sessions/${id}`) as unknown as Promise<{ success: boolean }>;
  },

  getSuggestedWords: async (): Promise<SuggestedWordsResponse> => {
    return api.get('/chat/suggested-words') as unknown as Promise<SuggestedWordsResponse>;
  },
};
