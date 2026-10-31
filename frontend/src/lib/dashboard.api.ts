import { api } from './api';

export interface RecentQuizItem {
  quizId: string;
  score: number;
  total: number;
  completedAt: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'saved' | 'reviewed' | 'quiz';
  title: string;
  description?: string;
  timestamp: string;
}

export interface WeeklyProgressItem {
  date: string;
  savedCount: number;
  reviewedCount: number;
  quizCount: number;
}

export interface DashboardStats {
  dueCount: number;
  totalSaved: number;
  totalReviewed: number;
  todayReviewedCount: number;
  dailyReviewGoal: number;
  streakDays: number;
  recentQuizzes: RecentQuizItem[];
  recentActivity: RecentActivityItem[];
  weeklyProgress: WeeklyProgressItem[];
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    return api.get('/dashboard/stats') as unknown as Promise<DashboardStats>;
  },
};
