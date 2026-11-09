import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationPage } from './ConversationPage';
import { voiceApi } from '../lib/voice.api';

vi.mock('../lib/voice.api', () => ({
  voiceApi: {
    startSession: vi.fn(),
    sendTurn: vi.fn(),
    endSession: vi.fn(),
    getSessions: vi.fn(),
    getSessionById: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

describe('ConversationPage', () => {
  const mockStartResponse = {
    sessionId: 'session-123',
    scenario: 'Coffee Shop & Cafe Orders',
    targetVocabulary: [
      { id: 'v-1', lemma: 'decaf', meaning: 'caffeine-free coffee' },
      { id: 'v-2', lemma: 'pastry', meaning: 'baked sweet item' },
    ],
    initialGreeting: 'Hi there! Welcome to the cafe. What can I get started for you today?',
    initialGreetingTranslation: 'Chào bạn! Chào mừng đến quán cà phê.',
    quickReplies: ['I want an iced latte, please.', 'Do you have decaf?'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(voiceApi.getSessions).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  const renderComponent = () =>
    render(
      <MantineProvider>
        <BrowserRouter>
          <ConversationPage />
        </BrowserRouter>
      </MantineProvider>,
    );

  it('renders initial setup view with scenario cards and start button', () => {
    renderComponent();

    expect(screen.getByText('Luyện Hội Thoại Tình Huống Đời Thực')).toBeInTheDocument();
    expect(screen.getByText('Quán Cà Phê (Coffee Shop)')).toBeInTheDocument();
    expect(screen.getByText('Khách Sạn & Du Lịch (Hotel & Travel)')).toBeInTheDocument();
    expect(screen.getByText('Bắt đầu luyện tập')).toBeInTheDocument();
    expect(screen.getByText('Lịch sử hội thoại')).toBeInTheDocument();
  });

  it('starts conversation session and renders dialogue greeting and target vocabulary', async () => {
    vi.mocked(voiceApi.startSession).mockResolvedValue(mockStartResponse);

    renderComponent();

    const startButton = screen.getByText('Bắt đầu luyện tập');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(voiceApi.startSession).toHaveBeenCalled();
    });

    // Check header and greeting
    expect(screen.getByText('Hi there! Welcome to the cafe. What can I get started for you today?')).toBeInTheDocument();
    expect(screen.getByText('Từ Vựng Mục Tiêu')).toBeInTheDocument();
    expect(screen.getByText('decaf')).toBeInTheDocument();
    expect(screen.getByText('pastry')).toBeInTheDocument();

    // Check quick replies rendered and clickable
    const quickReplyBtn = screen.getByText('I want an iced latte, please.');
    expect(quickReplyBtn).toBeInTheDocument();
    fireEvent.click(quickReplyBtn);
    expect(screen.getByPlaceholderText('Nói hoặc gõ câu trả lời của bạn...')).toHaveValue('I want an iced latte, please.');
  });

  it('sends user message, receives AI reply, and updates detected target words', async () => {
    vi.mocked(voiceApi.startSession).mockResolvedValue(mockStartResponse);
    vi.mocked(voiceApi.sendTurn).mockResolvedValue({
      assistantText: 'Sure thing, one hot decaf latte coming up! Anything else?',
      detectedTargetWords: ['decaf'],
      phrasingFeedback: 'A native speaker might say: "Could I get a decaf latte please?"',
      targetWordsRemaining: ['pastry'],
    });

    renderComponent();

    // Start
    fireEvent.click(screen.getByText('Bắt đầu luyện tập'));
    await waitFor(() => {
      expect(screen.getByText('Hi there! Welcome to the cafe. What can I get started for you today?')).toBeInTheDocument();
    });

    // Type and send turn
    const input = screen.getByPlaceholderText('Nói hoặc gõ câu trả lời của bạn...');
    fireEvent.change(input, { target: { value: 'I want a decaf latte' } });
    fireEvent.click(screen.getByText('Gửi'));

    await waitFor(() => {
      expect(voiceApi.sendTurn).toHaveBeenCalledWith({
        sessionId: 'session-123',
        userTranscript: 'I want a decaf latte',
      });
    });

    // Check user text rendered
    expect(screen.getByText('I want a decaf latte')).toBeInTheDocument();

    // Check assistant response rendered
    await waitFor(() => {
      expect(screen.getByText('Sure thing, one hot decaf latte coming up! Anything else?')).toBeInTheDocument();
    });

    // Check phrasing feedback tip rendered
    expect(screen.getByText('A native speaker might say: "Could I get a decaf latte please?"')).toBeInTheDocument();

    // Check detected badge
    expect(screen.getByText('✓ Đã dùng: decaf')).toBeInTheDocument();
  });

  it('ends session and displays summary modal with fluency metrics', async () => {
    vi.mocked(voiceApi.startSession).mockResolvedValue(mockStartResponse);
    vi.mocked(voiceApi.endSession).mockResolvedValue({
      sessionId: 'session-123',
      durationSeconds: 125,
      spokenMetrics: {
        totalWordsSpoken: 95,
        speakingPaceWpm: 110,
        fillerWordsCount: 1,
        activationRate: 50,
        conversationFluencyScore: 88,
      },
      dialogueSummary: 'Great casual conversation! You ordered effectively and used natural intonation.',
      naturalPhrasingTips: ['Instead of "I want", try using "Could I have".'],
      vocabularyMastered: ['decaf'],
    });

    renderComponent();

    fireEvent.click(screen.getByText('Bắt đầu luyện tập'));
    await waitFor(() => {
      expect(screen.getByText('Kết thúc & Nhận góp ý')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Kết thúc & Nhận góp ý'));

    await waitFor(() => {
      expect(voiceApi.endSession).toHaveBeenCalledWith({ sessionId: 'session-123' });
    });

    // Check summary modal content
    await waitFor(() => {
      expect(screen.getByText('Tổng Kết Buổi Hội Thoại')).toBeInTheDocument();
    });
    expect(screen.getByText('88 / 100')).toBeInTheDocument();
    expect(screen.getByText('95 từ')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Great casual conversation! You ordered effectively and used natural intonation.')).toBeInTheDocument();
    expect(screen.getByText('Instead of "I want", try using "Could I have".')).toBeInTheDocument();
  });

  it('opens history drawer and displays past conversations', async () => {
    vi.mocked(voiceApi.getSessions).mockResolvedValue({
      items: [
        {
          id: 'hist-1',
          scenarioPreset: 'coffee_shop',
          topic: 'Morning Coffee Order',
          durationSeconds: 180,
          status: 'completed',
          spokenMetrics: {
            totalWordsSpoken: 120,
            speakingPaceWpm: 115,
            fillerWordsCount: 2,
            activationRate: 100,
            conversationFluencyScore: 92,
          },
          dialogueSummary: 'Excellent roleplay at the cafe.',
          turnsCount: 6,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    renderComponent();

    const historyBtn = screen.getByText('Lịch sử hội thoại');
    fireEvent.click(historyBtn);

    await waitFor(() => {
      expect(voiceApi.getSessions).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Morning Coffee Order')).toBeInTheDocument();
    });
    expect(screen.getByText('92 pts')).toBeInTheDocument();
    expect(screen.getByText('Excellent roleplay at the cafe.')).toBeInTheDocument();
  });
});
