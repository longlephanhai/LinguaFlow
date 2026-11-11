import { describe, expect, it, vi } from 'vitest';
import { ReviewController } from './review.controller.js';

describe('ReviewController', () => {
  const mockReviewService = {
    getDueOccurrences: vi.fn(),
    recordReviewResult: vi.fn(),
    suspendCard: vi.fn(),
    syncBatchReviews: vi.fn(),
  };

  const controller = new ReviewController(mockReviewService as any);
  const user = { userId: '507f1f77bcf86cd799439011' };

  it('delegates syncBatchReviews to ReviewService with userId and dto', async () => {
    const dto = {
      items: [
        {
          occurrenceId: '507f1f77bcf86cd799439022',
          remembered: true,
          reviewedAt: '2026-11-11T14:00:00.000Z',
        },
      ],
    };

    const expectedResponse = {
      syncedCount: 1,
      results: [
        {
          occurrenceId: '507f1f77bcf86cd799439022',
          nextDueDate: '2026-11-17T14:00:00.000Z',
          intervalDays: 6,
          easeFactor: 2.5,
          repetition: 1,
          repetitions: 1,
        },
      ],
    };

    mockReviewService.syncBatchReviews.mockResolvedValue(expectedResponse);

    const result = await controller.syncBatchReviews(dto, user);

    expect(mockReviewService.syncBatchReviews).toHaveBeenCalledWith(user.userId, dto);
    expect(result).toEqual(expectedResponse);
  });

  it('delegates getDueOccurrences to ReviewService', async () => {
    mockReviewService.getDueOccurrences.mockResolvedValue({ occurrences: [] });
    const result = await controller.getDueOccurrences(user);
    expect(mockReviewService.getDueOccurrences).toHaveBeenCalledWith(user.userId);
    expect(result).toEqual({ occurrences: [] });
  });

  it('delegates recordReviewResult to ReviewService', async () => {
    const dto = { remembered: true };
    mockReviewService.recordReviewResult.mockResolvedValue({ nextDueDate: '2026-11-12T00:00:00.000Z', intervalDays: 1 });
    const result = await controller.recordReviewResult('occ-123', dto, user);
    expect(mockReviewService.recordReviewResult).toHaveBeenCalledWith(user.userId, 'occ-123', dto);
    expect(result).toEqual({ nextDueDate: '2026-11-12T00:00:00.000Z', intervalDays: 1 });
  });

  it('delegates suspendCard to ReviewService', async () => {
    const dto = { suspended: true };
    mockReviewService.suspendCard.mockResolvedValue({ success: true, suspended: true });
    const result = await controller.suspendCard('occ-123', dto, user);
    expect(mockReviewService.suspendCard).toHaveBeenCalledWith(user.userId, 'occ-123', dto);
    expect(result).toEqual({ success: true, suspended: true });
  });
});

