import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { dashboardApi } from '../lib/dashboard.api';

vi.mock('../lib/dashboard.api', () => ({
  dashboardApi: {
    getStats: vi.fn(),
  },
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@example.com', displayName: 'Alex' },
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loaded dashboard with user stats and metrics', async () => {
    vi.mocked(dashboardApi.getStats).mockResolvedValue({
      dueCount: 7,
      totalSaved: 42,
      totalReviewed: 18,
      todayReviewedCount: 5,
      dailyReviewGoal: 20,
      streakDays: 4,
      recentQuizzes: [
        {
          quizId: 'q-1',
          score: 9,
          total: 10,
          completedAt: new Date().toISOString(),
        },
      ],
      recentActivity: [
        {
          id: 'act-1',
          type: 'saved',
          title: 'Saved "profound"',
          description: 'A profound impact on culture',
          timestamp: new Date().toISOString(),
        },
      ],
      weeklyProgress: [
        {
          date: '2026-10-31',
          savedCount: 2,
          reviewedCount: 5,
          quizCount: 1,
        },
      ],
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Alex!/i)).toBeInTheDocument();
    });

    expect(screen.getByText('7 due')).toBeInTheDocument();
    expect(screen.getByText('Start Review')).toBeInTheDocument();
    expect(screen.getByText(/4 Days/i)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Saved "profound"')).toBeInTheDocument();
    expect(screen.getByText('Score: 9/10')).toBeInTheDocument();
  });

  it('displays onboarding banner when totalSaved is 0 (EDGE-008)', async () => {
    vi.mocked(dashboardApi.getStats).mockResolvedValue({
      dueCount: 0,
      totalSaved: 0,
      totalReviewed: 0,
      todayReviewedCount: 0,
      dailyReviewGoal: 20,
      streakDays: 0,
      recentQuizzes: [],
      recentActivity: [],
      weeklyProgress: [],
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome to LinguaFlow! Start your contextual vocabulary journey/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Go to Vocabulary')).toBeInTheDocument();
    expect(screen.getByText(/No activity recorded yet/i)).toBeInTheDocument();
  });

  it('displays error alert and retries when error occurs', async () => {
    vi.mocked(dashboardApi.getStats)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        dueCount: 2,
        totalSaved: 10,
        totalReviewed: 5,
        todayReviewedCount: 1,
        dailyReviewGoal: 20,
        streakDays: 1,
        recentQuizzes: [],
        recentActivity: [],
        weeklyProgress: [],
      });

    render(
      <MantineProvider>
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Error loading dashboard/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText(/2 due/i)).toBeInTheDocument();
    });
  });
});
