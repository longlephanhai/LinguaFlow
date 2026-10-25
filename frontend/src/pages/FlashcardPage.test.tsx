import { render, screen, waitFor } from '@testing-library/react';
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
});
