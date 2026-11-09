import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReaderPage } from './ReaderPage';
import { readerApi } from '../lib/reader.api';
import { vocabularyApi } from '../lib/vocabulary.api';

vi.mock('../lib/reader.api', () => ({
  readerApi: {
    parseArticle: vi.fn(),
    getArticles: vi.fn(),
    getArticleById: vi.fn(),
    deleteArticle: vi.fn(),
    batchSave: vi.fn(),
  },
}));

vi.mock('../lib/vocabulary.api', () => ({
  vocabularyApi: {
    lookup: vi.fn(),
    saveOccurrence: vi.fn(),
  },
}));

describe('ReaderPage', () => {
  const mockParsedArticle = {
    articleId: 'art-1',
    title: 'Modern Remote Work',
    sourceUrl: 'https://example.com/remote',
    totalWordCount: 15,
    paragraphs: [
      {
        sentences: [
          {
            text: 'Remote work has become ubiquitous across tech companies.',
            tokens: ['Remote', 'work', 'has', 'become', 'ubiquitous', 'across', 'tech', 'companies', '.'],
          },
        ],
      },
    ],
    discoveredVocabulary: [
      {
        lemma: 'ubiquitous',
        partOfSpeech: 'adjective',
        contextSentence: 'Remote work has become ubiquitous across tech companies.',
        definition: 'có mặt ở khắp nơi',
        isSaved: false,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readerApi.getArticles).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 8,
      totalPages: 1,
    });
  });

  const renderComponent = () =>
    render(
      <MantineProvider>
        <BrowserRouter>
          <ReaderPage />
        </BrowserRouter>
      </MantineProvider>,
    );

  it('renders initial input state with title, textarea, and sample buttons', () => {
    renderComponent();

    expect(screen.getByText(/Article & Story Reader/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Dán nội dung bài báo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Công nghệ & Remote Work/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bắt đầu đọc & Khám phá từ vựng/i })).toBeDisabled();
  });

  it('populates inputs when clicking sample article button', () => {
    renderComponent();

    const sampleBtn = screen.getByRole('button', { name: /Công nghệ & Remote Work/i });
    fireEvent.click(sampleBtn);

    const textarea = screen.getByPlaceholderText(/Dán nội dung bài báo/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Remote work has transitioned');
    expect(screen.getByRole('button', { name: /Bắt đầu đọc & Khám phá từ vựng/i })).not.toBeDisabled();
  });

  it('submits text and enters reading mode, rendering paragraphs and discovered vocabulary', async () => {
    vi.mocked(readerApi.parseArticle).mockResolvedValue(mockParsedArticle);
    renderComponent();

    const sampleBtn = screen.getByRole('button', { name: /Công nghệ & Remote Work/i });
    fireEvent.click(sampleBtn);

    const parseBtn = screen.getByRole('button', { name: /Bắt đầu đọc & Khám phá từ vựng/i });
    fireEvent.click(parseBtn);

    await waitFor(() => {
      expect(screen.getByText('Modern Remote Work')).toBeInTheDocument();
      expect(screen.getByText('15 từ')).toBeInTheDocument();
      expect(screen.getByText(/Từ vựng nổi bật \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText('có mặt ở khắp nơi')).toBeInTheDocument();
    });
  });

  it('clicks a word to trigger in-context lookup modal and saves word', async () => {
    vi.mocked(readerApi.parseArticle).mockResolvedValue(mockParsedArticle);
    vi.mocked(vocabularyApi.lookup).mockResolvedValue({
      lemma: 'ubiquitous',
      meaning: 'có mặt ở khắp mọi nơi',
      example: 'Smartphones are ubiquitous today.',
      partOfSpeech: 'adjective',
      cached: false,
    });
    vi.mocked(vocabularyApi.saveOccurrence).mockResolvedValue({
      item: {} as any,
      meaning: {} as any,
      occurrence: { _id: 'occ-1' } as any,
    });

    renderComponent();

    // Enter reading mode
    const sampleBtn = screen.getByRole('button', { name: /Công nghệ & Remote Work/i });
    fireEvent.click(sampleBtn);
    const parseBtn = screen.getByRole('button', { name: /Bắt đầu đọc & Khám phá từ vựng/i });
    fireEvent.click(parseBtn);

    await waitFor(() => {
      expect(screen.getByText('Modern Remote Work')).toBeInTheDocument();
    });

    // Click on the word "ubiquitous"
    const wordTokens = screen.getAllByText('ubiquitous');
    fireEvent.click(wordTokens[0]);

    await waitFor(() => {
      expect(screen.getByText('Giải nghĩa theo ngữ cảnh')).toBeInTheDocument();
      expect(screen.getByText('có mặt ở khắp mọi nơi')).toBeInTheDocument();
    });

    // Click save word
    const saveBtn = screen.getByRole('button', { name: /Lưu vào sổ từ vựng/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(vocabularyApi.saveOccurrence).toHaveBeenCalled();
    });
  });

  it('handles batch save of discovered vocabulary', async () => {
    vi.mocked(readerApi.parseArticle).mockResolvedValue(mockParsedArticle);
    vi.mocked(readerApi.batchSave).mockResolvedValue({
      savedCount: 1,
      occurrences: [{ id: 'occ-1', lemma: 'ubiquitous' }],
    });

    renderComponent();

    // Enter reading mode
    const sampleBtn = screen.getByRole('button', { name: /Công nghệ & Remote Work/i });
    fireEvent.click(sampleBtn);
    const parseBtn = screen.getByRole('button', { name: /Bắt đầu đọc & Khám phá từ vựng/i });
    fireEvent.click(parseBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Lưu tất cả/i })).toBeInTheDocument();
    });

    const batchSaveBtn = screen.getByRole('button', { name: /Lưu tất cả/i });
    fireEvent.click(batchSaveBtn);

    await waitFor(() => {
      expect(readerApi.batchSave).toHaveBeenCalledWith({
        articleId: 'art-1',
        items: [
          {
            lemma: 'ubiquitous',
            meaning: 'có mặt ở khắp nơi',
            contextSentence: 'Remote work has become ubiquitous across tech companies.',
            partOfSpeech: 'adjective',
          },
        ],
      });
    });
  });
});
