import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ReaderService, structureParagraphs } from './reader.service.js';

describe('ReaderService', () => {
  let service: ReaderService;
  let mockDocumentModel: any;
  let mockAiService: any;
  let mockVocabularyService: any;

  const userId = new Types.ObjectId().toString();
  const articleId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockDocumentModel = {
      create: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      countDocuments: vi.fn(),
    };

    mockAiService = {
      extractVocabularyFromText: vi.fn(),
    };

    mockVocabularyService = {
      saveOccurrence: vi.fn(),
    };

    service = new ReaderService(
      mockDocumentModel as any,
      mockAiService,
      mockVocabularyService,
    );
  });

  describe('structureParagraphs', () => {
    it('splits paragraphs, sentences, and tokens accurately', () => {
      const text = 'Remote work is ubiquitous now. It changes collaboration.\n\nTeam members adapt quickly!';
      const result = structureParagraphs(text);

      expect(result).toHaveLength(2);
      expect(result[0].sentences).toHaveLength(2);
      expect(result[0].sentences[0].text).toContain('Remote work is ubiquitous now.');
      expect(result[0].sentences[0].tokens).toContain('ubiquitous');
      expect(result[1].sentences[0].text).toContain('Team members adapt quickly!');
    });
  });

  describe('parseArticle', () => {
    it('parses text, discovers vocabulary, and saves document record', async () => {
      const sampleText = 'Cloud computing is ubiquitous in modern software engineering. It allows teams to scale infrastructure seamlessly.';
      mockAiService.extractVocabularyFromText.mockResolvedValue([
        {
          lemma: 'ubiquitous',
          partOfSpeech: 'adjective',
          contextSentence: 'Cloud computing is ubiquitous in modern software engineering.',
          definition: 'có mặt ở khắp nơi',
        },
      ]);

      mockDocumentModel.create.mockResolvedValue({
        _id: new Types.ObjectId(articleId),
        userId: new Types.ObjectId(userId),
        title: 'Cloud Computing Insights',
        content: sampleText,
        sourceUrl: 'https://example.com/article',
        totalWordCount: 16,
        extractedLemmasCount: 1,
        discoveredVocabulary: [
          {
            lemma: 'ubiquitous',
            partOfSpeech: 'adjective',
            contextSentence: 'Cloud computing is ubiquitous in modern software engineering.',
            definition: 'có mặt ở khắp nơi',
            isSaved: false,
          },
        ],
        createdAt: new Date(),
      });

      const result = await service.parseArticle(
        {
          title: 'Cloud Computing Insights',
          text: sampleText,
          sourceUrl: 'https://example.com/article',
        },
        userId,
      );

      expect(result.articleId).toBe(articleId);
      expect(result.title).toBe('Cloud Computing Insights');
      expect(result.paragraphs).toHaveLength(1);
      expect(result.discoveredVocabulary).toHaveLength(1);
      expect(result.discoveredVocabulary[0].lemma).toBe('ubiquitous');
      expect(mockAiService.extractVocabularyFromText).toHaveBeenCalledWith(sampleText, 6);
    });

    it('auto-generates title if none is provided', async () => {
      const sampleText = 'Language immersion helps learners build natural fluency over time without test stress.';
      mockAiService.extractVocabularyFromText.mockResolvedValue([]);
      mockDocumentModel.create.mockImplementation((data: any) => ({
        _id: new Types.ObjectId(articleId),
        ...data,
      }));

      const result = await service.parseArticle(
        {
          text: sampleText,
        },
        userId,
      );

      expect(result.title).toBeDefined();
      expect(mockDocumentModel.create).toHaveBeenCalled();
    });
  });

  describe('getArticles', () => {
    it('returns paginated articles list', async () => {
      const mockQueryChain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(articleId),
            title: 'Sample Article',
            sourceUrl: 'https://test.com',
            totalWordCount: 120,
            extractedLemmasCount: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };
      mockDocumentModel.find.mockReturnValue(mockQueryChain);
      mockDocumentModel.countDocuments.mockResolvedValue(1);

      const result = await service.getArticles(userId, { page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe('Sample Article');
    });
  });

  describe('getArticleById', () => {
    it('returns article details if found', async () => {
      mockDocumentModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(articleId),
        title: 'Saved Story',
        content: 'Once upon a time in a digital world.',
        sourceUrl: null,
        totalWordCount: 8,
        discoveredVocabulary: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getArticleById(articleId, userId);
      expect(result.id).toBe(articleId);
      expect(result.title).toBe('Saved Story');
      expect(result.paragraphs).toHaveLength(1);
    });

    it('throws NotFoundException if article does not exist', async () => {
      mockDocumentModel.findOne.mockResolvedValue(null);

      await expect(service.getArticleById(articleId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteArticle', () => {
    it('soft deletes article successfully', async () => {
      mockDocumentModel.findOneAndUpdate.mockResolvedValue({
        _id: new Types.ObjectId(articleId),
        isDeleted: true,
      });

      const result = await service.deleteArticle(articleId, userId);
      expect(result.success).toBe(true);
    });

    it('throws NotFoundException if article to delete is not found', async () => {
      mockDocumentModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.deleteArticle(articleId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('batchSaveVocabulary', () => {
    it('commits words to vocabulary bank via 3-layer saveOccurrence and marks isSaved', async () => {
      const mockDoc = {
        _id: new Types.ObjectId(articleId),
        title: 'Tech News',
        sourceUrl: 'https://news.com',
        discoveredVocabulary: [
          {
            lemma: 'scale',
            partOfSpeech: 'verb',
            contextSentence: 'We need to scale.',
            definition: 'mở rộng quy mô',
            isSaved: false,
          },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      mockDocumentModel.findOne.mockResolvedValue(mockDoc);
      mockVocabularyService.saveOccurrence.mockResolvedValue({
        occurrence: { _id: new Types.ObjectId() },
      });

      const result = await service.batchSaveVocabulary(
        {
          articleId,
          items: [
            {
              lemma: 'scale',
              meaning: 'mở rộng quy mô',
              contextSentence: 'We need to scale.',
              partOfSpeech: 'verb',
            },
          ],
        },
        userId,
      );

      expect(result.savedCount).toBe(1);
      expect(result.occurrences).toHaveLength(1);
      expect(mockDoc.discoveredVocabulary[0].isSaved).toBe(true);
      expect(mockVocabularyService.saveOccurrence).toHaveBeenCalled();
    });
  });
});

