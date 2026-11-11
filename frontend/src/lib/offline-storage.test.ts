import { describe, it, expect, beforeEach } from 'vitest';
import {
  cacheDueCards,
  getCachedDueCards,
  queueOfflineReview,
  getQueuedReviews,
  clearQueuedReviews,
  getQueuedReviewsCount,
} from './offline-storage';
import type { DueOccurrence } from './review.api';

describe('offline-storage', () => {
  const mockCards: DueOccurrence[] = [
    {
      id: 'occ-1',
      occurrenceId: 'occ-1',
      lemma: 'ephemeral',
      partOfSpeech: 'adj',
      selectedText: 'ephemeral',
      sentence: 'It was ephemeral.',
      meaning: 'Short-lived',
      definition: 'Short-lived',
      example: 'Example 1',
      sourceUrl: 'https://example.com',
      sourceTitle: 'Example',
    },
    {
      id: 'occ-2',
      occurrenceId: 'occ-2',
      lemma: 'resilience',
      partOfSpeech: 'noun',
      selectedText: 'resilience',
      sentence: 'Great resilience.',
      meaning: 'Ability to recover',
      definition: 'Ability to recover',
      example: 'Example 2',
      sourceUrl: 'https://example.com',
      sourceTitle: 'Example',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('caches due cards and retrieves them', async () => {
    await cacheDueCards(mockCards);
    const cached = await getCachedDueCards();
    expect(cached).toHaveLength(2);
    expect(cached[0].occurrenceId).toBe('occ-1');
    expect(cached[1].lemma).toBe('resilience');
  });

  it('queues offline review decisions and calculates pending count', async () => {
    await clearQueuedReviews();
    expect(await getQueuedReviewsCount()).toBe(0);

    await queueOfflineReview('occ-1', true);
    await queueOfflineReview('occ-2', false);

    expect(await getQueuedReviewsCount()).toBe(2);
    const queued = await getQueuedReviews();
    expect(queued).toHaveLength(2);
    expect(queued[0].occurrenceId).toBe('occ-1');
    expect(queued[0].remembered).toBe(true);
    expect(queued[1].occurrenceId).toBe('occ-2');
    expect(queued[1].remembered).toBe(false);
  });

  it('clears specific queued reviews or all reviews', async () => {
    await clearQueuedReviews();
    await queueOfflineReview('occ-1', true);
    await queueOfflineReview('occ-2', false);
    await queueOfflineReview('occ-3', true);

    // Clear specific
    await clearQueuedReviews(['occ-2']);
    let queued = await getQueuedReviews();
    expect(queued).toHaveLength(2);
    expect(queued.map((q) => q.occurrenceId)).toEqual(['occ-1', 'occ-3']);

    // Clear all
    await clearQueuedReviews();
    queued = await getQueuedReviews();
    expect(queued).toHaveLength(0);
    expect(await getQueuedReviewsCount()).toBe(0);
  });
});

