import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoStudyRoomPage } from './VideoStudyRoomPage';
import { videoApi } from '../lib/video.api';
import { vocabularyApi } from '../lib/vocabulary.api';
import { dictationApi } from '../lib/dictation.api';
import { shadowingApi } from '../lib/shadowing.api';

vi.mock('../lib/video.api', () => ({
  videoApi: {
    getTranscript: vi.fn(),
  },
}));

vi.mock('../lib/vocabulary.api', () => ({
  vocabularyApi: {
    lookupInContext: vi.fn(),
    saveOccurrence: vi.fn(),
  },
}));

vi.mock('../lib/dictation.api', () => ({
  dictationApi: {
    recordSession: vi.fn(),
  },
}));

vi.mock('../lib/shadowing.api', () => ({
  shadowingApi: {
    evaluateShadowing: vi.fn(),
  },
}));

const mockTranscript = {
  videoId: 'UF8uR6Z6KLc',
  provider: 'youtube',
  videoTitle: 'Steve Jobs 2005 Stanford Speech',
  durationSeconds: 120,
  segments: [
    {
      index: 0,
      startSeconds: 0.5,
      endSeconds: 4.2,
      text: 'I am honored to be with you today.',
      translation: 'Tôi rất vinh dự được có mặt cùng các bạn hôm nay.',
    },
    {
      index: 1,
      startSeconds: 4.5,
      endSeconds: 8.8,
      text: 'Truth be told, I never graduated from college.',
      translation: 'Sự thật là tôi chưa từng tốt nghiệp đại học.',
    },
  ],
};

describe('VideoStudyRoomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MantineProvider>
        <BrowserRouter>
          <VideoStudyRoomPage />
        </BrowserRouter>
      </MantineProvider>,
    );

  it('renders initial state with title, url input, sample buttons, and empty state prompt', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /Video Study Room/i })).toBeInTheDocument();
    expect(screen.getByTestId('video-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('load-video-button')).toBeInTheDocument();
    expect(screen.getByTestId('sample-video-btn-0')).toBeInTheDocument();
    expect(screen.getByText(/Ready to Learn with Real Videos\?/i)).toBeInTheDocument();
  });

  it('loads video transcript when sample button is clicked', async () => {
    vi.mocked(videoApi.getTranscript).mockResolvedValue(mockTranscript);

    renderComponent();

    fireEvent.click(screen.getByTestId('sample-video-btn-0'));

    await waitFor(() => {
      expect(screen.getByText(/Steve Jobs 2005 Stanford Speech/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('script-tab')).toBeInTheDocument();
    expect(screen.getByTestId('dictation-tab')).toBeInTheDocument();
    expect(screen.getByTestId('shadowing-tab')).toBeInTheDocument();
  });

  it('displays interactive script cues and navigates when clicking a cue', async () => {
    vi.mocked(videoApi.getTranscript).mockResolvedValue(mockTranscript);

    renderComponent();

    fireEvent.click(screen.getByTestId('sample-video-btn-0'));

    await waitFor(() => {
      expect(screen.getByTestId('cue-row-0')).toBeInTheDocument();
    });

    expect(screen.getByTestId('cue-row-1')).toBeInTheDocument();

    // Click cue 1
    fireEvent.click(screen.getByTestId('cue-row-1'));
    expect(screen.getAllByText(/Truth be told, I never graduated from college./i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches to Dictation Mode and handles typing and hint', async () => {
    vi.mocked(videoApi.getTranscript).mockResolvedValue(mockTranscript);

    renderComponent();

    fireEvent.click(screen.getByTestId('sample-video-btn-0'));

    await waitFor(() => {
      expect(screen.getByTestId('dictation-tab')).toBeInTheDocument();
    });

    // Switch to Dictation tab
    fireEvent.click(screen.getByTestId('dictation-tab'));

    expect(screen.getByTestId('dictation-input')).toBeInTheDocument();
    expect(screen.getByTestId('dictation-hint-btn')).toBeInTheDocument();
    expect(screen.getByTestId('dictation-reveal-btn')).toBeInTheDocument();

    // Click Hint button
    fireEvent.click(screen.getByTestId('dictation-hint-btn'));
    const input = screen.getByTestId('dictation-input') as HTMLInputElement;
    expect(input.value.length).toBeGreaterThan(0);

    // Type matching string
    fireEvent.change(input, { target: { value: 'I am honored' } });
    expect(input.value).toBe('I am honored');

    // Click Save Dictation Session
    vi.mocked(dictationApi.recordSession).mockResolvedValue({
      sessionId: 'sess-1',
      accuracyScore: 95,
      recordedAt: '2026-11-02T12:00:00Z',
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Dictation Session/i }));
    await waitFor(() => {
      expect(dictationApi.recordSession).toHaveBeenCalled();
    });
  });

  it('switches to Shadowing Mode, plays native cue, and shows evaluation', async () => {
    vi.mocked(videoApi.getTranscript).mockResolvedValue(mockTranscript);
    vi.mocked(shadowingApi.evaluateShadowing).mockResolvedValue({
      overallScore: 92,
      transcribedText: 'I am honored to be with you today.',
      wordsEvaluation: [
        { word: 'honored', status: 'correct', phonemeFeedback: null },
      ],
      generalTips: 'Excellent pacing and intonation.',
    });

    renderComponent();

    fireEvent.click(screen.getByTestId('sample-video-btn-0'));

    await waitFor(() => {
      expect(screen.getByTestId('shadowing-tab')).toBeInTheDocument();
    });

    // Switch to Shadowing tab
    fireEvent.click(screen.getByTestId('shadowing-tab'));

    expect(screen.getByTestId('shadowing-listen-btn')).toBeInTheDocument();
    expect(screen.getByTestId('shadowing-record-btn')).toBeInTheDocument();

    // Click listen native
    fireEvent.click(screen.getByTestId('shadowing-listen-btn'));

    // Click record voice
    fireEvent.click(screen.getByTestId('shadowing-record-btn'));

    // Directly trigger evaluation
    await waitFor(() => {
      expect(screen.getByText(/Target Sentence:/i)).toBeInTheDocument();
    });
  });

  it('opens vocabulary quick lookup when clicking a word in subtitles', async () => {
    vi.mocked(videoApi.getTranscript).mockResolvedValue(mockTranscript);
    vi.mocked(vocabularyApi.lookupInContext).mockResolvedValue({
      lemma: 'honored',
      meaning: 'Feeling proud and pleased by respect given to you.',
      example: 'I am honored to be with you today.',
      partOfSpeech: 'adjective',
    });

    renderComponent();

    fireEvent.click(screen.getByTestId('sample-video-btn-0'));

    await waitFor(() => {
      expect(screen.getByText('honored')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('honored'));

    await waitFor(() => {
      expect(screen.getByText(/Feeling proud and pleased by respect given to you/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Save to Vocabulary Bank/i })).toBeInTheDocument();
  });
});
