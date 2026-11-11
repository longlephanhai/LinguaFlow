import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncOfflineReviews, setupOnlineSyncListener } from './offline-sync';
import { queueOfflineReview, clearQueuedReviews, getQueuedReviewsCount } from './offline-storage';
import { reviewApi } from './review.api';

vi.mock('./review.api', () => ({
  reviewApi: {
    syncBatchReviews: vi.fn(),
  },
}));

describe('offline-sync', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearQueuedReviews();
    vi.clearAllMocks();
  });

  it('returns 0 synced when queue is empty', async () => {
    const result = await syncOfflineReviews();
    expect(result).toEqual({ synced: 0, failed: 0 });
    expect(reviewApi.syncBatchReviews).not.toHaveBeenCalled();
  });

  it('synchronizes queued reviews in batch and clears synced items', async () => {
    await queueOfflineReview('card-1', true);
    await queueOfflineReview('card-2', false);

    vi.mocked(reviewApi.syncBatchReviews).mockResolvedValue({
      syncedCount: 2,
      results: [
        {
          occurrenceId: 'card-1',
          nextDueDate: '2026-11-18T00:00:00.000Z',
          intervalDays: 6,
          easeFactor: 2.5,
          repetition: 1,
        },
        {
          occurrenceId: 'card-2',
          nextDueDate: '2026-11-12T00:00:00.000Z',
          intervalDays: 1,
          easeFactor: 2.3,
          repetition: 0,
        },
      ],
    });

    const result = await syncOfflineReviews();
    expect(result).toEqual({ synced: 2, failed: 0 });
    expect(reviewApi.syncBatchReviews).toHaveBeenCalledWith([
      expect.objectContaining({ occurrenceId: 'card-1', remembered: true }),
      expect.objectContaining({ occurrenceId: 'card-2', remembered: false }),
    ]);

    expect(await getQueuedReviewsCount()).toBe(0);
  });

  it('handles sync failures without clearing the queue', async () => {
    await queueOfflineReview('card-1', true);

    vi.mocked(reviewApi.syncBatchReviews).mockRejectedValue(new Error('Network error'));

    const result = await syncOfflineReviews();
    expect(result).toEqual({ synced: 0, failed: 1 });
    expect(await getQueuedReviewsCount()).toBe(1);
  });

  it('registers online sync listener and triggers sync when online event is dispatched', async () => {
    await queueOfflineReview('card-1', true);

    vi.mocked(reviewApi.syncBatchReviews).mockResolvedValue({
      syncedCount: 1,
      results: [],
    });

    const onSync = vi.fn();
    const cleanup = setupOnlineSyncListener(onSync);

    window.dispatchEvent(new Event('online'));

    // Wait for async handler
    await vi.waitFor(() => {
      expect(reviewApi.syncBatchReviews).toHaveBeenCalled();
    });

    cleanup();
  });
});

