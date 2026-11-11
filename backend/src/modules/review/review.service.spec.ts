import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service.js';
import { Types } from 'mongoose';

describe('ReviewService', () => {
  let service: ReviewService;
  let mockOccurrenceModel: any;
  let mockVocabularyItemModel: any;
  let mockMeaningModel: any;
  let mockUserModel: any;

  const userId = new Types.ObjectId().toString();
  const occurrenceId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockOccurrenceModel = {
      find: vi.fn(),
      findOne: vi.fn(),
    };
    mockVocabularyItemModel = {};
    mockMeaningModel = {};
    mockUserModel = {
      findById: vi.fn(),
    };

    service = new ReviewService(
      mockOccurrenceModel,
      mockVocabularyItemModel,
      mockMeaningModel,
      mockUserModel,
    );
  });

  describe('getDueOccurrences', () => {
    it('should query due occurrences and respect dailyReviewGoal', async () => {
      mockUserModel.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            settings: { dailyReviewGoal: 15 },
          }),
        }),
      });

      const mockOccurrences = [
        {
          _id: new Types.ObjectId(occurrenceId),
          selectedText: 'ubiquitous',
          sentence: 'Smartphones are ubiquitous.',
          sourceUrl: 'https://example.com',
          sourceTitle: 'Tech',
          vocabularyItemId: {
            lemma: 'ubiquitous',
            partOfSpeech: 'adjective',
          },
          meaningId: {
            definition: 'Present everywhere',
            example: 'Smartphones are ubiquitous.',
          },
          review: {
            easeFactor: 2.5,
            intervalDays: 1,
            repetitions: 0,
            dueDate: new Date('2026-10-25T00:00:00.000Z'),
          },
        },
      ];

      const execMock = vi.fn().mockResolvedValue(mockOccurrences);
      const populateMeaning = vi.fn().mockReturnValue({ exec: execMock });
      const populateVocab = vi.fn().mockReturnValue({ populate: populateMeaning });
      const limitMock = vi.fn().mockReturnValue({ populate: populateVocab });
      const sortMock = vi.fn().mockReturnValue({ limit: limitMock });

      mockOccurrenceModel.find.mockReturnValue({ sort: sortMock });

      const result = await service.getDueOccurrences(userId);

      expect(mockOccurrenceModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          isDeleted: false,
          'review.suspended': { $ne: true },
          'review.dueDate': expect.objectContaining({ $lte: expect.any(Date) }),
        }),
      );
      expect(limitMock).toHaveBeenCalledWith(15);
      expect(result.occurrences).toHaveLength(1);
      expect(result.occurrences[0]).toMatchObject({
        id: occurrenceId,
        lemma: 'ubiquitous',
        partOfSpeech: 'adjective',
        meaning: 'Present everywhere',
        sentence: 'Smartphones are ubiquitous.',
        mediaMetadata: null,
      });
    });

    it('should include mediaMetadata when present on due occurrence', async () => {
      mockUserModel.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            settings: { dailyReviewGoal: 20 },
          }),
        }),
      });

      const mockOccurrences = [
        {
          _id: new Types.ObjectId(occurrenceId),
          selectedText: 'serendipity',
          sentence: 'Finding that old book was pure serendipity.',
          sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
          sourceTitle: 'TED Talk',
          mediaMetadata: {
            provider: 'youtube',
            videoId: 'dQw4w9WgXcQ',
            timestampSeconds: 42,
            videoTitle: 'TED Talk',
            audioSnippetUrl: null,
          },
          vocabularyItemId: {
            lemma: 'serendipity',
            partOfSpeech: 'noun',
          },
          meaningId: {
            definition: 'The occurrence of events by chance in a happy way',
            example: 'A fortunate stroke of serendipity.',
          },
          review: {
            easeFactor: 2.5,
            intervalDays: 1,
            repetitions: 1,
            dueDate: new Date('2026-10-25T00:00:00.000Z'),
          },
        },
      ];

      const execMock = vi.fn().mockResolvedValue(mockOccurrences);
      const populateMeaning = vi.fn().mockReturnValue({ exec: execMock });
      const populateVocab = vi.fn().mockReturnValue({ populate: populateMeaning });
      const limitMock = vi.fn().mockReturnValue({ populate: populateVocab });
      const sortMock = vi.fn().mockReturnValue({ limit: limitMock });

      mockOccurrenceModel.find.mockReturnValue({ sort: sortMock });

      const result = await service.getDueOccurrences(userId);

      expect(result.occurrences).toHaveLength(1);
      expect(result.occurrences[0].mediaMetadata).toEqual({
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        timestampSeconds: 42,
        videoTitle: 'TED Talk',
        audioSnippetUrl: null,
      });
    });
  });

  describe('recordReviewResult', () => {
    it('should throw NotFoundException if occurrence is not found', async () => {
      mockOccurrenceModel.findOne.mockResolvedValue(null);

      await expect(
        service.recordReviewResult(userId, occurrenceId, { remembered: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update review schedule and save occurrence on successful recall', async () => {
      const mockOcc = {
        _id: new Types.ObjectId(occurrenceId),
        userId: new Types.ObjectId(userId),
        review: {
          easeFactor: 2.5,
          repetitions: 1,
          intervalDays: 1,
          dueDate: new Date(),
          suspended: false,
        },
        save: vi.fn().mockResolvedValue(true),
      };

      mockOccurrenceModel.findOne.mockResolvedValue(mockOcc);

      const result = await service.recordReviewResult(userId, occurrenceId, { remembered: true });

      expect(mockOcc.save).toHaveBeenCalled();
      expect(mockOcc.review.repetitions).toBe(2);
      expect(mockOcc.review.intervalDays).toBe(6);
      expect(mockOcc.review.easeFactor).toBe(2.6);
      expect(result).toHaveProperty('nextDueDate');
      expect(result.intervalDays).toBe(6);
    });
  });

  describe('suspendCard', () => {
    it('should toggle suspended status', async () => {
      const mockOcc = {
        _id: new Types.ObjectId(occurrenceId),
        userId: new Types.ObjectId(userId),
        review: {
          suspended: false,
        },
        save: vi.fn().mockResolvedValue(true),
      };

      mockOccurrenceModel.findOne.mockResolvedValue(mockOcc);

      const result = await service.suspendCard(userId, occurrenceId, { suspended: true });

      expect(mockOcc.review.suspended).toBe(true);
      expect(mockOcc.save).toHaveBeenCalled();
      expect(result.suspended).toBe(true);
    });
  });

  describe('syncBatchReviews', () => {
    it('should return empty result if dto has empty items', async () => {
      const result = await service.syncBatchReviews(userId, { items: [] });
      expect(result).toEqual({ syncedCount: 0, results: [] });
    });

    it('should return empty result if userId is invalid', async () => {
      const result = await service.syncBatchReviews('invalid-id', {
        items: [{ occurrenceId, remembered: true }],
      });
      expect(result).toEqual({ syncedCount: 0, results: [] });
    });

    it('should skip occurrences that are invalid or not found', async () => {
      mockOccurrenceModel.findOne.mockResolvedValue(null);

      const result = await service.syncBatchReviews(userId, {
        items: [
          { occurrenceId: 'invalid-occ-id', remembered: true },
          { occurrenceId, remembered: true },
        ],
      });

      expect(result).toEqual({ syncedCount: 0, results: [] });
    });

    it('should sync valid occurrences with correct SM-2 calculations and custom reviewedAt', async () => {
      const occId1 = new Types.ObjectId().toString();
      const occId2 = new Types.ObjectId().toString();

      const mockOcc1 = {
        _id: new Types.ObjectId(occId1),
        userId: new Types.ObjectId(userId),
        review: {
          easeFactor: 2.5,
          repetitions: 0,
          intervalDays: 1,
          dueDate: new Date(),
          suspended: false,
        },
        save: vi.fn().mockResolvedValue(true),
      };

      const mockOcc2 = {
        _id: new Types.ObjectId(occId2),
        userId: new Types.ObjectId(userId),
        review: {
          easeFactor: 2.5,
          repetitions: 1,
          intervalDays: 1,
          dueDate: new Date(),
          suspended: false,
        },
        save: vi.fn().mockResolvedValue(true),
      };

      mockOccurrenceModel.findOne
        .mockResolvedValueOnce(mockOcc1)
        .mockResolvedValueOnce(mockOcc2);

      const reviewDate1 = '2026-11-10T10:00:00.000Z';
      const reviewDate2 = '2026-11-10T12:00:00.000Z';

      const result = await service.syncBatchReviews(userId, {
        items: [
          { occurrenceId: occId1, remembered: true, reviewedAt: reviewDate1 },
          { occurrenceId: occId2, remembered: false, reviewedAt: reviewDate2 },
        ],
      });

      expect(result.syncedCount).toBe(2);
      expect(result.results).toHaveLength(2);

      // occ1: first successful review -> rep=1, interval=1, easeFactor=2.6
      expect(mockOcc1.save).toHaveBeenCalled();
      expect(result.results[0]).toMatchObject({
        occurrenceId: occId1,
        intervalDays: 1,
        easeFactor: 2.6,
        repetition: 1,
      });

      // occ2: failed recall -> rep=0, interval=1, easeFactor=2.3
      expect(mockOcc2.save).toHaveBeenCalled();
      expect(result.results[1]).toMatchObject({
        occurrenceId: occId2,
        intervalDays: 1,
        easeFactor: 2.3,
        repetition: 0,
      });
    });
  });
});
