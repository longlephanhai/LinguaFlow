import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardController } from './dashboard.controller.js';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockDashboardService: any;

  const mockUser = { userId: 'user-456' };

  beforeEach(() => {
    mockDashboardService = {
      getStats: vi.fn(),
    };

    controller = new DashboardController(mockDashboardService);
  });

  it('getStats should delegate to dashboardService.getStats', async () => {
    const mockStats = {
      dueCount: 4,
      totalSaved: 10,
      totalReviewed: 8,
      todayReviewedCount: 2,
      dailyReviewGoal: 20,
      streakDays: 2,
      recentQuizzes: [],
      recentActivity: [],
      weeklyProgress: [],
    };
    mockDashboardService.getStats.mockResolvedValue(mockStats);

    const result = await controller.getStats(mockUser);
    expect(mockDashboardService.getStats).toHaveBeenCalledWith('user-456');
    expect(result).toEqual(mockStats);
  });
});
