import { api } from './api';

export interface SentenceToken {
  text: string;
  tokens: string[];
}

export interface ReaderParagraph {
  sentences: SentenceToken[];
}

export interface DiscoveredVocabItem {
  lemma: string;
  partOfSpeech: string;
  contextSentence: string;
  definition: string;
  isSaved?: boolean;
}

export interface ParseArticleRequest {
  title?: string;
  text: string;
  sourceUrl?: string;
}

export interface ParsedArticleResponse {
  articleId: string;
  title: string;
  sourceUrl: string | null;
  totalWordCount: number;
  paragraphs: ReaderParagraph[];
  discoveredVocabulary: DiscoveredVocabItem[];
  createdAt: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  sourceUrl: string | null;
  totalWordCount: number;
  extractedLemmasCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListResponse {
  items: ArticleListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ArticleDetailResponse {
  id: string;
  title: string;
  content: string;
  sourceUrl: string | null;
  totalWordCount: number;
  paragraphs: ReaderParagraph[];
  discoveredVocabulary: DiscoveredVocabItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BatchSaveReaderRequest {
  articleId: string;
  items: Array<{
    lemma: string;
    meaning: string;
    contextSentence: string;
    partOfSpeech?: string;
  }>;
}

export interface BatchSaveReaderResponse {
  savedCount: number;
  occurrences: Array<{ id: string; lemma: string }>;
}

export const readerApi = {
  parseArticle: (data: ParseArticleRequest): Promise<ParsedArticleResponse> => {
    return api.post('/reader/parse', data) as unknown as Promise<ParsedArticleResponse>;
  },

  getArticles: (page = 1, limit = 10): Promise<ArticleListResponse> => {
    return api.get(`/reader/articles?page=${page}&limit=${limit}`) as unknown as Promise<ArticleListResponse>;
  },

  getArticleById: (id: string): Promise<ArticleDetailResponse> => {
    return api.get(`/reader/articles/${id}`) as unknown as Promise<ArticleDetailResponse>;
  },

  deleteArticle: (id: string): Promise<{ success: boolean }> => {
    return api.delete(`/reader/articles/${id}`) as unknown as Promise<{ success: boolean }>;
  },

  batchSave: (data: BatchSaveReaderRequest): Promise<BatchSaveReaderResponse> => {
    return api.post('/reader/batch-save', data) as unknown as Promise<BatchSaveReaderResponse>;
  },
};
