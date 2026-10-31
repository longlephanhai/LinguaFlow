import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WritingPage } from './WritingPage';
import { writingApi } from '../lib/writing.api';

vi.mock('../lib/writing.api', () => ({
  writingApi: {
    submitReview: vi.fn(),
    getHistory: vi.fn(),
    getReviewById: vi.fn(),
    deleteReview: vi.fn(),
    getSuggestedWords: vi.fn(),
  },
}));

describe('WritingPage', () => {
  beforeEach(() => {
    vi.mocked(writingApi.getSuggestedWords).mockResolvedValue({
      words: ['resilient', 'ubiquitous'],
    });
    vi.mocked(writingApi.getHistory).mockResolvedValue({
      items: [
        {
          _id: 'review-1',
          originalText: 'Yesterday I have visited my grandparents in the village.',
          wordCount: 9,
          suggestionsCount: 1,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 8,
      totalPages: 1,
    });
  });

  it('renders writing page with title, input area, and sample text button', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <WritingPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    expect(screen.getByText(/Writing Review/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write your response here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sample Text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Review Writing/i })).toBeDisabled();
  });

  it('populates textarea when clicking Sample Text', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <WritingPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    const sampleBtn = screen.getByRole('button', { name: /Sample Text/i });
    fireEvent.click(sampleBtn);

    const textarea = screen.getByPlaceholderText(/Write your response here/i) as HTMLTextAreaElement;
    expect(textarea.value.length).toBeGreaterThanOrEqual(20);

    const reviewBtn = screen.getByRole('button', { name: /Review Writing/i });
    expect(reviewBtn).not.toBeDisabled();
  });

  it('submits text and displays AI feedback and suggestions', async () => {
    vi.mocked(writingApi.submitReview).mockResolvedValue({
      _id: 'review-new',
      originalText: 'I have went to school yesterday because the weather was pleasant.',
      wordCount: 11,
      feedback: 'Good effort! However, there is a verb tense mistake.',
      suggestions: ["Use 'went' instead of 'have went' for simple past events."],
      aiModel: 'gemini-flash-lite-latest',
      createdAt: new Date().toISOString(),
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <WritingPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    const textarea = screen.getByPlaceholderText(/Write your response here/i);
    fireEvent.change(textarea, {
      target: { value: 'I have went to school yesterday because the weather was pleasant.' },
    });

    const reviewBtn = screen.getByRole('button', { name: /Review Writing/i });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText('Overall Evaluation')).toBeInTheDocument();
      expect(screen.getByText('Good effort! However, there is a verb tense mistake.')).toBeInTheDocument();
      expect(screen.getByText(/Actionable Suggestions & Corrections/i)).toBeInTheDocument();
      expect(screen.getByText("Use 'went' instead of 'have went' for simple past events.")).toBeInTheDocument();
    });
  });

  it('displays error alert when review fails', async () => {
    vi.mocked(writingApi.submitReview).mockRejectedValue({
      response: { data: { error: { message: 'AI service unavailable' } } },
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <WritingPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    const textarea = screen.getByPlaceholderText(/Write your response here/i);
    fireEvent.change(textarea, {
      target: { value: 'This is a test paragraph that is definitely long enough to submit.' },
    });

    const reviewBtn = screen.getByRole('button', { name: /Review Writing/i });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText('Review Failed')).toBeInTheDocument();
      expect(screen.getByText('AI service unavailable')).toBeInTheDocument();
    });
  });

  it('inserts sentence starter into draft when clicking Insert Starter', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <WritingPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    const insertStarterBtn = screen.getByRole('button', { name: /Insert Starter/i });
    fireEvent.click(insertStarterBtn);

    const textarea = screen.getByPlaceholderText(/Write your response here/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Every morning');
  });

  it('renders suggested vocabulary challenge and inserts clicked chip into textarea', async () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <WritingPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('+ resilient')).toBeInTheDocument();
      expect(screen.getByText('+ ubiquitous')).toBeInTheDocument();
    });

    const chip = screen.getByText('+ resilient');
    fireEvent.click(chip);

    const textarea = screen.getByPlaceholderText(/Write your response here/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('resilient');
  });
});
