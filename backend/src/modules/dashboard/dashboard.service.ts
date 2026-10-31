import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Occurrence } from '../vocabulary/schemas/occurrence.schema.js';
import { VocabularyItem } from '../vocabulary/schemas/vocabulary-item.schema.js';
import { QuizResult } from '../quiz/schemas/quiz-result.schema.js';
import { User } from '../users/schemas/user.schema.js';

export interface DashboardStats {
  dueCount: number;
  totalSaved: number;
  totalReviewed: number;
  todayReviewedCount: number;
  dailyReviewGoal: number;
  streakDays: number;
  recentQuizzes: Array<{
    quizId: string;
    score: number;
    total: number;
    completedAt: Date;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'saved' | 'reviewed' | 'quiz';
    title: string;
    description?: string;
    timestamp: Date;
  }>;
  weeklyProgress: Array<{
    date: string;
    savedCount: number;
    reviewedCount: number;
    quizCount: number;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Occurrence.name)
    private readonly occurrenceModel: Model<Occurrence>,
    @InjectModel(VocabularyItem.name)
    private readonly vocabularyItemModel: Model<VocabularyItem>,
    @InjectModel(QuizResult.name)
    private readonly quizResultModel: Model<QuizResult>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getStats(userId: string): Promise<DashboardStats> {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    sixtyDaysAgo.setHours(0, 0, 0, 0);

    // Parallelize core queries
    const [
      dueCount,
      totalSaved,
      totalReviewed,
      todayReviewedCount,
      user,
      recentQuizResults,
      savedPerDay,
      reviewedPerDay,
      quizzesPerDay,
      recentReviewsActivity,
      recentSavesActivity,
      recentQuizzesActivity,
      recentSavedOccurrences,
      recentReviewedOccurrences,
      recentCompletedQuizzes,
    ] = await Promise.all([
      // 1. Due occurrences for review
      this.occurrenceModel.countDocuments({
        userId: userObjectId,
        isDeleted: false,
        'review.suspended': false,
        'review.dueDate': { $lte: now },
      }),

      // 2. Total words saved
      this.vocabularyItemModel.countDocuments({
        userId: userObjectId,
        isDeleted: false,
      }),

      // 3. Total reviews completed
      this.occurrenceModel.countDocuments({
        userId: userObjectId,
        isDeleted: false,
        'review.lastReviewedAt': { $ne: null },
      }),

      // 4. Reviewed today
      this.occurrenceModel.countDocuments({
        userId: userObjectId,
        isDeleted: false,
        'review.lastReviewedAt': { $gte: startOfToday },
      }),

      // 5. User settings
      this.userModel.findOne({
        _id: userObjectId,
        isDeleted: false,
      }),

      // 6. Recent 5 quizzes
      this.quizResultModel
        .find({
          userId: userObjectId,
          isDeleted: false,
        })
        .sort({ completedAt: -1 })
        .limit(5)
        .lean(),

      // 7. Weekly saved
      this.occurrenceModel.aggregate([
        {
          $match: {
            userId: userObjectId,
            isDeleted: false,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),

      // 8. Weekly reviewed
      this.occurrenceModel.aggregate([
        {
          $match: {
            userId: userObjectId,
            isDeleted: false,
            'review.lastReviewedAt': { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$review.lastReviewedAt' } },
            count: { $sum: 1 },
          },
        },
      ]),

      // 9. Weekly quizzes
      this.quizResultModel.aggregate([
        {
          $match: {
            userId: userObjectId,
            isDeleted: false,
            completedAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
      ]),

      // 10-12. Streak data (60 days)
      this.occurrenceModel.aggregate([
        {
          $match: {
            userId: userObjectId,
            isDeleted: false,
            'review.lastReviewedAt': { $gte: sixtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$review.lastReviewedAt' } },
          },
        },
      ]),
      this.occurrenceModel.aggregate([
        {
          $match: {
            userId: userObjectId,
            isDeleted: false,
            createdAt: { $gte: sixtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
        },
      ]),
      this.quizResultModel.aggregate([
        {
          $match: {
            userId: userObjectId,
            isDeleted: false,
            completedAt: { $gte: sixtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          },
        },
      ]),

      // 13-15. Recent activity sources
      this.occurrenceModel
        .find({ userId: userObjectId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      this.occurrenceModel
        .find({
          userId: userObjectId,
          isDeleted: false,
          'review.lastReviewedAt': { $ne: null },
        })
        .sort({ 'review.lastReviewedAt': -1 })
        .limit(10)
        .lean(),
      this.quizResultModel
        .find({ userId: userObjectId, isDeleted: false })
        .sort({ completedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const dailyReviewGoal = user?.settings?.dailyReviewGoal ?? 20;

    // Process recent quizzes
    const recentQuizzes = recentQuizResults.map((qr) => ({
      quizId: qr.quizId.toString(),
      score: qr.score,
      total: qr.totalQuestions,
      completedAt: qr.completedAt,
    }));

    // Process weekly progress map
    const savedMap = new Map<string, number>();
    for (const item of savedPerDay) {
      savedMap.set(item._id, item.count);
    }
    const reviewedMap = new Map<string, number>();
    for (const item of reviewedPerDay) {
      reviewedMap.set(item._id, item.count);
    }
    const quizMap = new Map<string, number>();
    for (const item of quizzesPerDay) {
      quizMap.set(item._id, item.count);
    }

    const weeklyProgress: DashboardStats['weeklyProgress'] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      weeklyProgress.push({
        date: dateStr,
        savedCount: savedMap.get(dateStr) || 0,
        reviewedCount: reviewedMap.get(dateStr) || 0,
        quizCount: quizMap.get(dateStr) || 0,
      });
    }

    // Process streak days
    const activeDateSet = new Set<string>([
      ...recentReviewsActivity.map((r) => r._id),
      ...recentSavesActivity.map((s) => s._id),
      ...recentQuizzesActivity.map((q) => q._id),
    ]);

    let streakDays = 0;
    const checkDate = new Date(now);
    let checkDateStr = checkDate.toISOString().slice(0, 10);

    if (!activeDateSet.has(checkDateStr)) {
      // Allow streak to continue if yesterday was active and today has not had activity yet
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = checkDate.toISOString().slice(0, 10);
    }

    while (activeDateSet.has(checkDateStr)) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = checkDate.toISOString().slice(0, 10);
    }

    // Process recent activity
    const activities: DashboardStats['recentActivity'] = [];

    for (const occ of recentSavedOccurrences) {
      activities.push({
        id: `save_${occ._id.toString()}`,
        type: 'saved',
        title: `Saved "${occ.selectedText}"`,
        description: occ.sentence,
        timestamp: occ.createdAt || occ.capturedAt,
      });
    }

    for (const occ of recentReviewedOccurrences) {
      if (occ.review?.lastReviewedAt) {
        activities.push({
          id: `rev_${occ._id.toString()}_${new Date(occ.review.lastReviewedAt).getTime()}`,
          type: 'reviewed',
          title: `Reviewed "${occ.selectedText}"`,
          description: occ.sentence,
          timestamp: occ.review.lastReviewedAt,
        });
      }
    }

    for (const q of recentCompletedQuizzes) {
      activities.push({
        id: `quiz_${q._id.toString()}`,
        type: 'quiz',
        title: `Completed Quiz (${q.score}/${q.totalQuestions})`,
        description: `Score: ${Math.round((q.score / (q.totalQuestions || 1)) * 100)}%`,
        timestamp: q.completedAt,
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activities.slice(0, 10);

    return {
      dueCount,
      totalSaved,
      totalReviewed,
      todayReviewedCount,
      dailyReviewGoal,
      streakDays,
      recentQuizzes,
      recentActivity,
      weeklyProgress,
    };
  }
}
