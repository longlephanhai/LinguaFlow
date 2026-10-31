import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatPage } from './ChatPage';
import { chatApi } from '../lib/chat.api';

vi.mock('../lib/chat.api', () => ({
  chatApi: {
    sendMessage: vi.fn(),
    getSessions: vi.fn(),
    getSession: vi.fn(),
    deleteSession: vi.fn(),
    getSuggestedWords: vi.fn(),
  },
}));

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chatApi.getSessions).mockResolvedValue({
      items: [
        {
          id: 'session-1',
          title: 'Practicing business vocabulary',
          messageCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    vi.mocked(chatApi.getSuggestedWords).mockResolvedValue({
      words: ['resilient', 'ubiquitous'],
    });
  });

  it('renders chat interface with welcome state and session list', async () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    expect(screen.getByText(/LinguaFlow AI Tutor/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to AI Conversation Practice/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Practicing business vocabulary')).toBeInTheDocument();
      expect(screen.getByText('+resilient')).toBeInTheDocument();
      expect(screen.getByText('+ubiquitous')).toBeInTheDocument();
    });
  });

  it('inserts clicked vocabulary chip into input', async () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('+resilient')).toBeInTheDocument();
    });

    const chip = screen.getByText('+resilient');
    fireEvent.click(chip);

    const input = screen.getByLabelText(/Chat input/i) as HTMLTextAreaElement;
    expect(input.value).toContain('resilient');
  });

  it('sends message and updates conversation stream', async () => {
    vi.mocked(chatApi.sendMessage).mockResolvedValue({
      sessionId: 'session-new',
      reply: 'Great job! "Resilient" means able to withstand difficult conditions.',
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </MantineProvider>,
    );

    const input = screen.getByLabelText(/Chat input/i);
    fireEvent.change(input, { target: { value: 'How do I use resilient?' } });

    const sendBtn = screen.getByLabelText(/Send message/i);
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('How do I use resilient?')).toBeInTheDocument();
      expect(screen.getByText(/Great job! "Resilient" means able to withstand/i)).toBeInTheDocument();
    });
  });
});
