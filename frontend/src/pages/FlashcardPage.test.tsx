import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  },
}));

describe('FlashcardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
