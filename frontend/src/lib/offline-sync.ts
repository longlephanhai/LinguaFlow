// Background and auto-synchronization for offline reviews
import { reviewApi, type BatchReviewSyncItem } from './review.api';
import { getQueuedReviews, clearQueuedReviews, getQueuedReviewsCount } from './offline-storage';

export interface SyncResult {
  synced: number;
  failed: number;
}

/**
 * Synchronize all queued offline reviews with the backend.
 */
export async function syncOfflineReviews(): Promise<SyncResult> {
  const queue = await getQueuedReviews();
  if (!queue || queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const items: BatchReviewSyncItem[] = queue.map((item) => ({
    occurrenceId: item.occurrenceId,
    remembered: item.remembered,
    reviewedAt: item.reviewedAt,
  }));

  const BATCH_SIZE = 200;
  let totalSynced = 0;
  let totalFailed = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    try {
      const response = await reviewApi.syncBatchReviews(chunk);
      const syncedIds = chunk.map((c) => c.occurrenceId);
      await clearQueuedReviews(syncedIds);
      totalSynced += response.syncedCount ?? chunk.length;
    } catch {
      totalFailed += chunk.length;
    }
  }

  return {
    synced: totalSynced,
    failed: totalFailed,
  };
}

/**
 * Hook or helper to set up auto-sync when the browser regains internet connectivity.
 */
export function setupOnlineSyncListener(onSync?: (result: SyncResult) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = async () => {
    const count = await getQueuedReviewsCount();
    if (count > 0) {
      const result = await syncOfflineReviews();
      if (onSync) {
        onSync(result);
      }
    }
  };

  window.addEventListener('online', handleOnline);
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

