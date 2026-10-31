import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockOccurrenceModel: any;
  let mockVocabularyItemModel: any;
  let mockQuizResultModel: any;
  let mockUserModel: any;

  const userId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockOccurrenceModel = {
      countDocuments: vi.fn(),
      aggregate: vi.fn(),
      find: vi.fn(),
    };

    mockVocabularyItemModel = {
      countDocuments: vi.fn(),
    };

    mockQuizResultModel = {
      find: vi.fn(),
      aggregate: vi.fn(),
    };

    mockUserModel = {
      findOne: vi.fn(),
    };

    service = new DashboardService(
      mockOccurrenceModel,
      mockVocabularyItemModel,
      mockQuizResultModel,
      mockUserModel,
    );
  });

  describe('getStats', () => {
    it('should return aggregated stats with streak and weekly progress', async () => {
      // 1. Due count
      mockOccurrenceModel.countDocuments
        .mockResolvedValueOnce(5) // dueCount
        .mockResolvedValueOnce(12) // totalReviewed
        .mockResolvedValueOnce(3); // todayReviewedCount

      // 2. Total saved
      mockVocabularyItemModel.countDocuments.mockResolvedValueOnce(25);

      // 3. User settings
      mockUserModel.findOne.mockResolvedValueOnce({
        _id: new Types.ObjectId(userId),
        settings: { dailyReviewGoal: 20 },
      });

      // 4. Recent quizzes
      const quizDate = new Date();
      mockQuizResultModel.find.mockReturnValueOnce({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              {
                quizId: new Types.ObjectId(),
                score: 8,
                totalQuestions: 10,
                completedAt: quizDate,
              },
            ]),
          }),
        }),
      });

      // 5-7. Weekly aggregations
      const todayStr = new Date().toISOString().slice(0, 10);
      mockOccurrenceModel.aggregate
        .mockResolvedValueOnce([{ _id: todayStr, count: 4 }]) // savedPerDay
        .mockResolvedValueOnce([{ _id: todayStr, count: 3 }]) // reviewedPerDay
        .mockResolvedValueOnce([{ _id: todayStr }]) // recentReviewsActivity
        .mockResolvedValueOnce([{ _id: todayStr }]); // recentSavesActivity

      mockQuizResultModel.aggregate
        .mockResolvedValueOnce([{ _id: todayStr, count: 1 }]) // quizzesPerDay
        .mockResolvedValueOnce([{ _id: todayStr }]); // recentQuizzesActivity

      // 8-10. Recent activity finds
      const occId = new Types.ObjectId();
      mockOccurrenceModel.find
        .mockReturnValueOnce({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([
                {
                  _id: occId,
                  selectedText: 'scale',
                  sentence: 'We need to scale.',
                  createdAt: new Date(),
                },
              ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([
                {
                  _id: occId,
                  selectedText: 'scale',
                  sentence: 'We need to scale.',
                  review: {
                    lastReviewedAt: new Date(),
                    intervalDays: 3,
                  },
                },
              ]),
            }),
          }),
        });

      mockQuizResultModel.find.mockReturnValueOnce({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(),
                score: 8,
                totalQuestions: 10,
                completedAt: quizDate,
              },
            ]),
          }),
        }),
      });

      const stats = await service.getStats(userId);

      expect(stats.dueCount).toBe(5);
      expect(stats.totalSaved).toBe(25);
      expect(stats.totalReviewed).toBe(12);
      expect(stats.todayReviewedCount).toBe(3);
      expect(stats.dailyReviewGoal).toBe(20);
      expect(stats.streakDays).toBeGreaterThanOrEqual(1);
      expect(stats.recentQuizzes.length).toBe(1);
      expect(stats.recentQuizzes[0].score).toBe(8);
      expect(stats.weeklyProgress.length).toBe(7);
      expect(stats.recentActivity.length).toBe(3);
    });

    it('should fallback to default settings if user not found', async () => {
      mockOccurrenceModel.countDocuments.mockResolvedValue(0);
      mockVocabularyItemModel.countDocuments.mockResolvedValue(0);
      mockUserModel.findOne.mockResolvedValue(null);
      mockQuizResultModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockOccurrenceModel.aggregate.mockResolvedValue([]);
      mockQuizResultModel.aggregate.mockResolvedValue([]);
      mockOccurrenceModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const stats = await service.getStats(userId);

      expect(stats.dailyReviewGoal).toBe(20);
      expect(stats.dueCount).toBe(0);
      expect(stats.streakDays).toBe(0);
      expect(stats.recentActivity).toEqual([]);
      expect(stats.weeklyProgress.length).toBe(7);
    });
  });
});
