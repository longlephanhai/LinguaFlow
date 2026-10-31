import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WritingService } from './writing.service.js';

describe('WritingService', () => {
  let service: WritingService;
  let mockWritingReviewModel: any;
  let mockAiService: any;
  let mockVocabularyService: any;

  const userId = new Types.ObjectId().toString();
  const reviewId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockWritingReviewModel = function (data: any) {
      return {
        _id: new Types.ObjectId(reviewId),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };
    };

    mockWritingReviewModel.findOne = vi.fn();
    mockWritingReviewModel.find = vi.fn();
    mockWritingReviewModel.countDocuments = vi.fn();

    mockAiService = {
      reviewWriting: vi.fn(),
    };

    mockVocabularyService = {
      getRecentLemmas: vi.fn().mockResolvedValue(['scale', 'resilient', 'ubiquitous']),
    };

    service = new WritingService(
      mockWritingReviewModel as any,
      mockAiService,
      mockVocabularyService,
    );
  });

  describe('reviewWriting', () => {
    it('should throw BadRequestException if text length < 20', async () => {
      await expect(
        service.reviewWriting(userId, { text: 'Too short text' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if text length > 5000', async () => {
      const longText = 'a'.repeat(5001);
      await expect(
        service.reviewWriting(userId, { text: longText }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should review writing successfully and save to database (FR-WRITING-001 AC-1)', async () => {
      mockAiService.reviewWriting.mockResolvedValue({
        feedback: 'Overall clear communication with minor tense issues.',
        suggestions: ["Use 'went' instead of 'have went'."],
        aiModel: 'gemini-flash-lite-latest',
      });

      const text = 'I have went to school yesterday because the weather was pleasant.';
      const result = await service.reviewWriting(userId, { text });

      expect(mockAiService.reviewWriting).toHaveBeenCalledWith(text);
      expect(result).toHaveProperty('_id');
      expect(result.originalText).toBe(text);
      expect(result.wordCount).toBe(11);
      expect(result.feedback).toBe('Overall clear communication with minor tense issues.');
      expect(result.suggestions).toEqual(["Use 'went' instead of 'have went'."]);
      expect(result.aiModel).toBe('gemini-flash-lite-latest');
    });
  });

  describe('getHistory', () => {
    it('should return paginated history with truncated originalText (FR-WRITING-002 AC-1/AC-2)', async () => {
      const longSentence = 'This is a very long text '.repeat(10);
      const mockDocs = [
        {
          _id: new Types.ObjectId(),
          originalText: longSentence,
          wordCount: 60,
          suggestions: ['Suggestion 1', 'Suggestion 2'],
          createdAt: new Date(),
        },
      ];

      mockWritingReviewModel.countDocuments.mockResolvedValue(1);
      mockWritingReviewModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockDocs),
            }),
          }),
        }),
      });

      const result = await service.getHistory(userId, { page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].originalText.length).toBeLessThanOrEqual(100);
      expect(result.items[0].originalText.endsWith('...')).toBe(true);
      expect(result.items[0].wordCount).toBe(60);
      expect(result.items[0].suggestionsCount).toBe(2);
    });
  });

  describe('getReviewById', () => {
    it('should throw NotFoundException for invalid ObjectId', async () => {
      await expect(service.getReviewById(userId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if review is not found', async () => {
      mockWritingReviewModel.findOne.mockResolvedValue(null);
      await expect(service.getReviewById(userId, new Types.ObjectId().toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return review details when found', async () => {
      const mockDoc = {
        _id: new Types.ObjectId(reviewId),
        originalText: 'Full original text here that was submitted.',
        wordCount: 7,
        feedback: 'Good work.',
        suggestions: ['Suggestion 1'],
        aiModel: 'gemini-flash-lite-latest',
        createdAt: new Date(),
      };

      mockWritingReviewModel.findOne.mockResolvedValue(mockDoc);

      const result = await service.getReviewById(userId, reviewId);

      expect(result._id).toBe(reviewId);
      expect(result.originalText).toBe(mockDoc.originalText);
      expect(result.feedback).toBe('Good work.');
      expect(result.suggestions).toEqual(['Suggestion 1']);
    });
  });

  describe('deleteReview', () => {
    it('should soft delete the review', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      const mockDoc = {
        _id: new Types.ObjectId(reviewId),
        isDeleted: false,
        deletedAt: null,
        save: saveMock,
      };

      mockWritingReviewModel.findOne.mockResolvedValue(mockDoc);

      const result = await service.deleteReview(userId, reviewId);

      expect(mockDoc.isDeleted).toBe(true);
      expect(mockDoc.deletedAt).toBeInstanceOf(Date);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('getSuggestedWords', () => {
    it('should return random unique words from user vocabulary bank', async () => {
      mockVocabularyService.getRecentLemmas.mockResolvedValue([
        'scale',
        'resilient',
        'ubiquitous',
        'pragmatic',
      ]);

      const result = await service.getSuggestedWords(userId);

      expect(result).toHaveProperty('words');
      expect(Array.isArray(result.words)).toBe(true);
      expect(result.words.length).toBeLessThanOrEqual(6);
      expect(mockVocabularyService.getRecentLemmas).toHaveBeenCalledWith(userId, 20);
    });

    it('should return empty words array if user has no saved vocabulary', async () => {
      mockVocabularyService.getRecentLemmas.mockResolvedValue([]);

      const result = await service.getSuggestedWords(userId);

      expect(result).toEqual({ words: [] });
    });
  });
});

