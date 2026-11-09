import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReaderController } from './reader.controller.js';

describe('ReaderController', () => {
  let controller: ReaderController;
  let mockReaderService: any;

  const mockUser = { userId: '507f1f77bcf86cd799439011' };

  beforeEach(() => {
    mockReaderService = {
      parseArticle: vi.fn(),
      getArticles: vi.fn(),
      getArticleById: vi.fn(),
      deleteArticle: vi.fn(),
      batchSaveVocabulary: vi.fn(),
    };

    controller = new ReaderController(mockReaderService);
  });

  it('delegates parseArticle to service with current user id', async () => {
    mockReaderService.parseArticle.mockResolvedValue({ articleId: '123' });
    const dto = { text: 'Some text here for test' };
    const res = await controller.parseArticle(dto as any, mockUser);
    expect(res).toEqual({ articleId: '123' });
    expect(mockReaderService.parseArticle).toHaveBeenCalledWith(dto, mockUser.userId);
  });

  it('delegates getArticles to service', async () => {
    mockReaderService.getArticles.mockResolvedValue({ items: [], total: 0 });
    const query = { page: 1, limit: 10 };
    const res = await controller.getArticles(query, mockUser);
    expect(res).toEqual({ items: [], total: 0 });
    expect(mockReaderService.getArticles).toHaveBeenCalledWith(mockUser.userId, query);
  });

  it('delegates getArticleById to service', async () => {
    mockReaderService.getArticleById.mockResolvedValue({ id: '123', title: 'Test' });
    const res = await controller.getArticleById('123', mockUser);
    expect(res).toEqual({ id: '123', title: 'Test' });
    expect(mockReaderService.getArticleById).toHaveBeenCalledWith('123', mockUser.userId);
  });

  it('delegates deleteArticle to service', async () => {
    mockReaderService.deleteArticle.mockResolvedValue({ success: true });
    const res = await controller.deleteArticle('123', mockUser);
    expect(res).toEqual({ success: true });
    expect(mockReaderService.deleteArticle).toHaveBeenCalledWith('123', mockUser.userId);
  });

  it('delegates batchSaveVocabulary to service', async () => {
    mockReaderService.batchSaveVocabulary.mockResolvedValue({ savedCount: 1 });
    const dto = { articleId: '123', items: [] };
    const res = await controller.batchSaveVocabulary(dto as any, mockUser);
    expect(res).toEqual({ savedCount: 1 });
    expect(mockReaderService.batchSaveVocabulary).toHaveBeenCalledWith(dto, mockUser.userId);
  });
});
