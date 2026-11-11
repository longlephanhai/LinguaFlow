import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlashcardPage } from './FlashcardPage';
import { reviewApi } from '../lib/review.api';

vi.mock('../lib/review.api', () => ({
  reviewApi: {
    getDueOccurrences: vi.fn(),
    recordResult: vi.fn(),
    suspendCard: vi.fn(),
    syncBatchReviews: vi.fn(),
  },
}));

describe('FlashcardPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    const { clearQueuedReviews } = await import('../lib/offline-storage');
    await clearQueuedReviews();
  });

  it('renders empty state when there are no due cards', async () => {
    vi.mocked(reviewApi.getDueOccurrences).mockResolvedValue({
      occurrences: [],
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <FlashcardPage />
        </BrowserRouter>
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/All Caught Up!/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Go to Vocabulary/i })).toBeInTheDocument();
  });

  it('renders flashcard with sentence when cards are available', async () => {
    vi.mocked(reviewApi.getDueOccurrences).mockResolvedValue({
      occurrences: [
        {
          id: 'card-1',
          occurrenceId: 'card-1',
          lemma: 'ephemeral',
          partOfSpeech: 'adjective',
          selectedText: 'ephemeral',
          sentence: 'The sunset was ephemeral.',
          meaning: 'Lasting a short time',
          definition: 'Lasting a short time',
          example: 'Ephemeral beauty fades quickly.',
          sourceUrl: 'https://example.com',
          sourceTitle: 'Example Site',
        },
      ],
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <FlashcardPage />
        </BrowserRouter>
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Show meaning & answer/i })).toBeInTheDocument();
    });

    expect(screen.getByText('adjective')).toBeInTheDocument();
    expect(
      screen.getByText((_content, element) => element?.tagName.toLowerCase() === 'mark' && element.textContent === 'ephemeral')
    ).toBeInTheDocument();
  });

  it('displays Play Context Clip button on card back when mediaMetadata is present and loads pre-rolled video player', async () => {
    vi.mocked(reviewApi.getDueOccurrences).mockResolvedValue({
      occurrences: [
        {
          id: 'card-video-1',
          occurrenceId: 'card-video-1',
          lemma: 'serendipity',
          partOfSpeech: 'noun',
          selectedText: 'serendipity',
          sentence: 'Finding that book was pure serendipity.',
          meaning: 'Sự tình cờ may mắn',
          definition: 'Sự tình cờ may mắn',
          example: 'A stroke of serendipity.',
          sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=102s',
          sourceTitle: 'TED Talk',
          mediaMetadata: {
            provider: 'youtube',
            videoId: 'dQw4w9WgXcQ',
            timestampSeconds: 102,
            videoTitle: 'TED Talk: How Luck Works',
          },
        },
        {
          id: 'card-2',
          occurrenceId: 'card-2',
          lemma: 'resilient',
          partOfSpeech: 'adjective',
          selectedText: 'resilient',
          sentence: 'She is very resilient.',
          meaning: 'Kiên cường',
          definition: 'Kiên cường',
          example: 'Resilient communities.',
          sourceUrl: 'https://example.com',
          sourceTitle: 'Article',
          mediaMetadata: null,
        },
      ],
    });

    vi.mocked(reviewApi.recordResult).mockResolvedValue({
      nextDueDate: '2026-11-05T00:00:00.000Z',
      intervalDays: 3,
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <FlashcardPage />
        </BrowserRouter>
      </MantineProvider>
    );

    const showAnswerBtn = await screen.findByRole('button', { name: /Show meaning & answer/i });
    fireEvent.click(showAnswerBtn);

    expect(await screen.findByText('TED Talk: How Luck Works')).toBeInTheDocument();
    expect(screen.getByText('1:42')).toBeInTheDocument();

    const playClipBtn = screen.getByRole('button', { name: /Play Context Clip/i });
    expect(playClipBtn).toBeInTheDocument();

    fireEvent.click(playClipBtn);

    const iframe = screen.getByTestId('context-clip-iframe') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    // Pre-rolled 2s before 102s (start=100) and stops 3s after 102s (end=105)
    expect(iframe.src).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=100&end=105&autoplay=1');

    // Close clip works
    const closeBtn = screen.getByRole('button', { name: /Close Clip/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('context-clip-iframe')).not.toBeInTheDocument();

    // Re-open and advance to next card -> clip player resets
    fireEvent.click(screen.getByRole('button', { name: /Play Context Clip/i }));
    expect(screen.getByTestId('context-clip-iframe')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Remembered/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('context-clip-iframe')).not.toBeInTheDocument();
    });
  });

  it('falls back to cached due cards when offline and displays offline mode badge', async () => {
    // API throws network failure
    vi.mocked(reviewApi.getDueOccurrences).mockRejectedValue(new Error('Network error'));

    // Populate local cache
    const { cacheDueCards } = await import('../lib/offline-storage');
    await cacheDueCards([
      {
        id: 'cached-card-1',
        occurrenceId: 'cached-card-1',
        lemma: 'solitude',
        partOfSpeech: 'noun',
        selectedText: 'solitude',
        sentence: 'He enjoyed the peace of solitude.',
        meaning: 'State of being alone',
        definition: 'State of being alone',
        example: 'In solitude he found peace.',
        sourceUrl: 'https://example.com',
        sourceTitle: 'Example',
      },
    ]);

    render(
      <MantineProvider>
        <BrowserRouter>
          <FlashcardPage />
        </BrowserRouter>
      </MantineProvider>
    );

    // Card should be rendered from cache
    await waitFor(() => {
      expect(screen.getByText('Offline Mode (Using cached cards)')).toBeInTheDocument();
    });
    expect(
      screen.getByText((_content, element) => element?.tagName.toLowerCase() === 'mark' && element.textContent === 'solitude')
    ).toBeInTheDocument();
  });

  it('queues review decision offline when offline or network fails, and shows offline feedback', async () => {
    vi.mocked(reviewApi.getDueOccurrences).mockResolvedValue({
      occurrences: [
        {
          id: 'card-offline-1',
          occurrenceId: 'card-offline-1',
          lemma: 'ephemeral',
          partOfSpeech: 'adj',
          selectedText: 'ephemeral',
          sentence: 'Moments are ephemeral.',
          meaning: 'Fleeting',
          definition: 'Fleeting',
          example: 'Ephemeral beauty',
          sourceUrl: 'https://example.com',
          sourceTitle: 'Example',
        },
      ],
    });

    // Network error when posting result
    vi.mocked(reviewApi.recordResult).mockRejectedValue(new Error('Failed to fetch'));

    render(
      <MantineProvider>
        <BrowserRouter>
          <FlashcardPage />
        </BrowserRouter>
      </MantineProvider>
    );

    const showAnswerBtn = await screen.findByRole('button', { name: /Show meaning & answer/i });
    fireEvent.click(showAnswerBtn);

    const rememberedBtn = screen.getByRole('button', { name: /Remembered/i });
    fireEvent.click(rememberedBtn);

    await waitFor(async () => {
      const { getQueuedReviews } = await import('../lib/offline-storage');
      const queued = await getQueuedReviews();
      expect(queued).toHaveLength(1);
      expect(queued[0].occurrenceId).toBe('card-offline-1');
      expect(queued[0].remembered).toBe(true);
    });

    // Session completes with queued reviews message
    expect(await screen.findByText(/1 review\(s\) are queued offline and will sync when you are back online/i)).toBeInTheDocument();
  });

  it('displays pending sync badge and triggers batch sync on Sync click', async () => {
    const { queueOfflineReview } = await import('../lib/offline-storage');
    await queueOfflineReview('card-pending-1', true);

    vi.mocked(reviewApi.getDueOccurrences).mockResolvedValue({
      occurrences: [],
    });

    vi.mocked(reviewApi.syncBatchReviews).mockResolvedValue({
      syncedCount: 1,
      results: [
        {
          occurrenceId: 'card-pending-1',
          nextDueDate: '2026-11-18T00:00:00.000Z',
          intervalDays: 6,
          easeFactor: 2.5,
          repetition: 1,
        },
      ],
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <FlashcardPage />
        </BrowserRouter>
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/1 review pending sync/i)).toBeInTheDocument();
    });

    const syncBtn = screen.getByRole('button', { name: /Sync Offline Reviews/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(reviewApi.syncBatchReviews).toHaveBeenCalledWith([
        expect.objectContaining({ occurrenceId: 'card-pending-1', remembered: true }),
      ]);
    });
  });

  it('renders Install App button when beforeinstallprompt event is dispatched', async () => {
    vi.mocked(reviewApi.getDueOccurrences).mockResolvedValue({
      occurrences: [
        {
          id: 'card-install-1',
          occurrenceId: 'card-install-1',
          lemma: 'resilience',
          partOfSpeech: 'noun',
          selectedText: 'resilience',
          sentence: 'She demonstrated resilience.',
          meaning: 'Bounce back',
          definition: 'Bounce back',
          example: 'High resilience',
          sourceUrl: 'https://example.com',
          sourceTitle: 'Example',
        },
      ],
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <FlashcardPage />
        </BrowserRouter>
      </MantineProvider>
    );

    await screen.findByRole('button', { name: /Show meaning & answer/i });

    // Dispatch beforeinstallprompt event
    const promptEvent = new Event('beforeinstallprompt');
    Object.assign(promptEvent, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });

    await act(async () => {
      window.dispatchEvent(promptEvent);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Install App/i })).toBeInTheDocument();
    });
  });
});
