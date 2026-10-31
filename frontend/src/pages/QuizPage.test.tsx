import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuizPage } from './QuizPage';
import { quizApi } from '../lib/quiz.api';

vi.mock('../lib/quiz.api', () => ({
  quizApi: {
    generate: vi.fn(),
    answer: vi.fn(),
    getResult: vi.fn(),
    getHistory: vi.fn(),
  },
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: { id: 'u1', settings: { quizDefaultCount: 10 } },
  }),
}));

describe('QuizPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders configuration view with title and start button', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    expect(screen.getByText(/AI Vocabulary Quiz/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start AI Quiz/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /History/i })).toBeInTheDocument();
  });

  it('starts quiz and displays active question with 4 options', async () => {
    vi.mocked(quizApi.generate).mockResolvedValue({
      quizId: 'quiz-1',
      questions: [
        {
          index: 0,
          questionText: 'What is the meaning of "resilient" in context?',
          options: ['Fragile', 'Able to recover quickly', 'Lazy', 'Heavy'],
        },
      ],
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    const startBtn = screen.getByRole('button', { name: /Start AI Quiz/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(screen.getByText('What is the meaning of "resilient" in context?')).toBeInTheDocument();
    });

    expect(screen.getByText('Able to recover quickly')).toBeInTheDocument();
    expect(screen.getByText('Fragile')).toBeInTheDocument();
    expect(screen.getByText('Lazy')).toBeInTheDocument();
    expect(screen.getByText('Heavy')).toBeInTheDocument();
  });

  it('evaluates answer and shows explanation when an option is clicked', async () => {
    vi.mocked(quizApi.generate).mockResolvedValue({
      quizId: 'quiz-1',
      questions: [
        {
          index: 0,
          questionText: 'What is the meaning of "resilient" in context?',
          options: ['Fragile', 'Able to recover quickly', 'Lazy', 'Heavy'],
        },
      ],
    });

    vi.mocked(quizApi.answer).mockResolvedValue({
      correct: true,
      correctIndex: 1,
      explanation: 'Resilient describes the capacity to recover quickly from difficulties.',
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    const startBtn = screen.getByRole('button', { name: /Start AI Quiz/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(screen.getByText('What is the meaning of "resilient" in context?')).toBeInTheDocument();
    });

    const correctOption = screen.getByText('Able to recover quickly');
    fireEvent.click(correctOption);

    await waitFor(() => {
      expect(
        screen.getByText('Resilient describes the capacity to recover quickly from difficulties.'),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Complete Quiz/i })).toBeInTheDocument();
  });
});
