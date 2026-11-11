// Offline storage implementation using IndexedDB with localStorage fallback
import type { DueOccurrence } from './review.api';

export interface OfflineReviewItem {
  id?: number;
  occurrenceId: string;
  remembered: boolean;
  reviewedAt: string;
}

const DB_NAME = 'linguaflow-offline-db';
const DB_VERSION = 1;
const STORE_CARDS = 'due_cards';
const STORE_QUEUE = 'review_queue';

const FALLBACK_KEY_CARDS = 'linguaflow_offline_due_cards';
const FALLBACK_KEY_QUEUE = 'linguaflow_offline_review_queue';

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CARDS)) {
        db.createObjectStore(STORE_CARDS, { keyPath: 'occurrenceId' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

// Fallback localStorage helpers
function getLocalStorageFallback<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalStorageFallback<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Cache current due cards for offline access.
 */
export async function cacheDueCards(cards: DueOccurrence[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CARDS, 'readwrite');
      const store = tx.objectStore(STORE_CARDS);
      store.clear();
      for (const card of cards) {
        store.put(card);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage
    setLocalStorageFallback(FALLBACK_KEY_CARDS, cards);
  }
}

/**
 * Retrieve cached due cards when offline.
 */
export async function getCachedDueCards(): Promise<DueOccurrence[]> {
  try {
    const db = await openDB();
    return await new Promise<DueOccurrence[]>((resolve, reject) => {
      const tx = db.transaction(STORE_CARDS, 'readonly');
      const store = tx.objectStore(STORE_CARDS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as DueOccurrence[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return getLocalStorageFallback<DueOccurrence[]>(FALLBACK_KEY_CARDS, []);
  }
}

/**
 * Queue an offline review decision.
 */
export async function queueOfflineReview(occurrenceId: string, remembered: boolean): Promise<void> {
  const item: OfflineReviewItem = {
    occurrenceId,
    remembered,
    reviewedAt: new Date().toISOString(),
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      store.add(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const queue = getLocalStorageFallback<OfflineReviewItem[]>(FALLBACK_KEY_QUEUE, []);
    queue.push(item);
    setLocalStorageFallback(FALLBACK_KEY_QUEUE, queue);
  }
}

/**
 * Retrieve all pending queued reviews.
 */
export async function getQueuedReviews(): Promise<OfflineReviewItem[]> {
  try {
    const db = await openDB();
    return await new Promise<OfflineReviewItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as OfflineReviewItem[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return getLocalStorageFallback<OfflineReviewItem[]>(FALLBACK_KEY_QUEUE, []);
  }
}

/**
 * Clear queued reviews (either all, or by a list of occurrenceIds).
 */
export async function clearQueuedReviews(occurrenceIds?: string[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);

      if (!occurrenceIds || occurrenceIds.length === 0) {
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } else {
        const idSet = new Set(occurrenceIds);
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            const currentItem = cursor.value as OfflineReviewItem;
            if (idSet.has(currentItem.occurrenceId)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      }
    });
  } catch {
    if (!occurrenceIds || occurrenceIds.length === 0) {
      setLocalStorageFallback(FALLBACK_KEY_QUEUE, []);
    } else {
      const idSet = new Set(occurrenceIds);
      const queue = getLocalStorageFallback<OfflineReviewItem[]>(FALLBACK_KEY_QUEUE, []);
      const filtered = queue.filter((item) => !idSet.has(item.occurrenceId));
      setLocalStorageFallback(FALLBACK_KEY_QUEUE, filtered);
    }
  }
}

/**
 * Count how many reviews are pending synchronization.
 */
export async function getQueuedReviewsCount(): Promise<number> {
  try {
    const db = await openDB();
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const queue = getLocalStorageFallback<OfflineReviewItem[]>(FALLBACK_KEY_QUEUE, []);
    return queue.length;
  }
}

