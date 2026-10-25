import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service.js';

describe('VocabularyService', () => {
  let service: VocabularyService;
  let mockVocabItemModel: any;
  let mockMeaningModel: any;
  let mockOccurrenceModel: any;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockItemId = '507f1f77bcf86cd799439012';
  const mockMeaningId = '507f1f77bcf86cd799439013';
  const mockOccId = '507f1f77bcf86cd799439014';

  beforeEach(() => {
    vi.clearAllMocks();

    mockVocabItemModel = {
      findOne: vi.fn(),
      create: vi.fn(),
      countDocuments: vi.fn(),
      find: vi.fn(),
      findOneAndUpdate: vi.fn(),
    };

    mockMeaningModel = {
      findOne: vi.fn(),
      create: vi.fn(),
      countDocuments: vi.fn(),
      updateOne: vi.fn(),
      updateMany: vi.fn(),
    };

    mockOccurrenceModel = {
      create: vi.fn(),
      countDocuments: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      updateMany: vi.fn(),
    };

    service = new VocabularyService(
      mockVocabItemModel as any,
      mockMeaningModel as any,
      mockOccurrenceModel as any,
    );
  });

  describe('saveOccurrence', () => {
    it('should create new VocabularyItem, Meaning, and Occurrence when they do not exist', async () => {
      mockVocabItemModel.findOne.mockResolvedValue(null);
      mockVocabItemModel.create.mockResolvedValue({
        _id: mockItemId,
        lemma: 'ephemeral',
        partOfSpeech: 'adjective',
      });

      mockMeaningModel.findOne.mockResolvedValue(null);
      mockMeaningModel.create.mockResolvedValue({
        _id: mockMeaningId,
        definition: 'lasting for a very short time',
      });

      mockOccurrenceModel.create.mockResolvedValue({
        _id: mockOccId,
      });

      const result = await service.saveOccurrence(
        {
          lemma: 'Ephemeral',
          meaning: 'lasting for a very short time',
          sentence: 'Fame in the digital age is ephemeral.',
          sourceUrl: 'https://example.com/fame',
          partOfSpeech: 'adjective',
        },
        mockUserId,
      );

      expect(mockVocabItemModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lemma: 'ephemeral',
          partOfSpeech: 'adjective',
        }),
      );
      expect(mockMeaningModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          definition: 'lasting for a very short time',
        }),
      );
      expect(mockOccurrenceModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sentence: 'Fame in the digital age is ephemeral.',
          sourceUrl: 'https://example.com/fame',
        }),
      );
      expect(result).toEqual({
        occurrenceId: mockOccId,
        vocabularyItemId: mockItemId,
        meaningId: mockMeaningId,
      });
    });

    it('should reuse existing VocabularyItem and Meaning if they already exist', async () => {
      const existingItem = {
        _id: mockItemId,
        lemma: 'ephemeral',
        isDeleted: false,
        save: vi.fn(),
      };
      const existingMeaning = {
        _id: mockMeaningId,
        definition: 'lasting for a very short time',
        isDeleted: false,
        save: vi.fn(),
      };

      mockVocabItemModel.findOne.mockResolvedValue(existingItem);
      mockMeaningModel.findOne.mockResolvedValue(existingMeaning);
      mockOccurrenceModel.create.mockResolvedValue({
        _id: mockOccId,
      });

      const result = await service.saveOccurrence(
        {
          lemma: 'ephemeral',
          meaning: 'lasting for a very short time',
          sentence: 'Spring blossoms are beautiful but ephemeral.',
          sourceUrl: 'https://example.com/spring',
        },
        mockUserId,
      );

      expect(mockVocabItemModel.create).not.toHaveBeenCalled();
      expect(mockMeaningModel.create).not.toHaveBeenCalled();
      expect(mockOccurrenceModel.create).toHaveBeenCalled();
      expect(result.occurrenceId).toBe(mockOccId);
    });
  });

  describe('findAll', () => {
    it('should return paginated items with meaning and occurrence counts', async () => {
      mockVocabItemModel.countDocuments.mockResolvedValue(1);
      mockVocabItemModel.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: mockItemId,
            lemma: 'ephemeral',
            partOfSpeech: 'adjective',
            createdAt: new Date(),
          },
        ]),
      });

      mockMeaningModel.countDocuments.mockResolvedValue(2);
      mockOccurrenceModel.countDocuments.mockResolvedValue(3);

      const result = await service.findAll(mockUserId, { page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: mockItemId,
          lemma: 'ephemeral',
          meaningsCount: 2,
          occurrencesCount: 3,
        }),
      );
    });
  });

  describe('findOccurrences', () => {
    it('should return occurrences for valid vocabulary item', async () => {
      mockVocabItemModel.findOne.mockResolvedValue({ _id: mockItemId });
      mockOccurrenceModel.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: mockOccId,
            sentence: 'Sample sentence',
            selectedText: 'sample',
            sourceUrl: 'https://example.com',
            sourceTitle: 'Example',
            meaningId: { definition: 'Sample def', example: 'Sample ex' },
            capturedAt: new Date(),
          },
        ]),
      });

      const result = await service.findOccurrences(mockUserId, mockItemId);
      expect(result.occurrences).toHaveLength(1);
      expect(result.occurrences[0].sentence).toBe('Sample sentence');
      expect(result.occurrences[0].meaning).toBe('Sample def');
    });

    it('should throw NotFoundException if vocabulary item does not exist', async () => {
      mockVocabItemModel.findOne.mockResolvedValue(null);

      await expect(
        service.findOccurrences(mockUserId, mockItemId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOccurrence', () => {
    it('should soft delete occurrence', async () => {
      mockOccurrenceModel.findOneAndUpdate.mockResolvedValue({
        _id: mockOccId,
        isDeleted: true,
      });

      const result = await service.deleteOccurrence(mockUserId, mockOccId);
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when occurrence not found', async () => {
      mockOccurrenceModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.deleteOccurrence(mockUserId, mockOccId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteVocabularyItem', () => {
    it('should cascade soft delete item, meanings, and occurrences', async () => {
      mockVocabItemModel.findOneAndUpdate.mockResolvedValue({
        _id: mockItemId,
        isDeleted: true,
      });
      mockMeaningModel.updateMany.mockResolvedValue({ modifiedCount: 2 });
      mockOccurrenceModel.updateMany.mockResolvedValue({ modifiedCount: 4 });

      const result = await service.deleteVocabularyItem(mockUserId, mockItemId);

      expect(mockVocabItemModel.findOneAndUpdate).toHaveBeenCalled();
      expect(mockMeaningModel.updateMany).toHaveBeenCalled();
      expect(mockOccurrenceModel.updateMany).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when vocabulary item not found', async () => {
      mockVocabItemModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.deleteVocabularyItem(mockUserId, mockItemId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
