import { api } from './api';

export interface QuizQuestionItem {
  index: number;
  questionText: string;
  options: [string, string, string, string];
}

export interface GenerateQuizRequest {
  scope?: 'all' | 'recent';
  count?: number;
}

export interface GenerateQuizResponse {
  quizId: string;
  questions: QuizQuestionItem[];
}

export interface AnswerQuizRequest {
  questionIndex: number;
  selectedIndex: number;
  timeSpentMs?: number;
}

export interface AnswerQuizResponse {
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

export interface QuizResultAnswer {
  questionIndex: number;
  selectedIndex: number;
  correct: boolean;
  timeSpentMs?: number;
}

export interface QuizResultResponse {
  quizId: string;
  score: number;
  total: number;
  completedAt: string;
  answers: QuizResultAnswer[];
}

export interface QuizHistoryItem {
  quizId: string;
  score: number;
  total: number;
  scope: string;
  completedAt: string;
}

export interface QuizHistoryResponse {
  items: QuizHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const quizApi = {
  generate: async (params?: GenerateQuizRequest): Promise<GenerateQuizResponse> => {
    return api.post('/quiz/generate', params || {}) as unknown as Promise<GenerateQuizResponse>;
  },

  answer: async (quizId: string, data: AnswerQuizRequest): Promise<AnswerQuizResponse> => {
    return api.post(`/quiz/${quizId}/answer`, data) as unknown as Promise<AnswerQuizResponse>;
  },

  getResult: async (quizId: string): Promise<QuizResultResponse> => {
    return api.get(`/quiz/${quizId}/result`) as unknown as Promise<QuizResultResponse>;
  },

  getHistory: async (page = 1, limit = 10): Promise<QuizHistoryResponse> => {
    return api.get(`/quiz/history?page=${page}&limit=${limit}`) as unknown as Promise<QuizHistoryResponse>;
  },
};
