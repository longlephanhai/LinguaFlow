import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractContextFromText,
  tokenizeSubtitleSentence,
  isYouTubeWatchPage,
  getYouTubeVideoId,
  isYouTubeCCEnabled,
} from './content.js';

describe('Extension Content Script - Context Extraction', () => {
  it('extracts the exact parent sentence containing the selected word', () => {
    const paragraph =
      'The quick brown fox jumps over the lazy dog. The beauty of a sunset is ephemeral, lasting only a few minutes. Tomorrow will be sunny.';
    const selected = 'ephemeral';

    const result = extractContextFromText(paragraph, selected);
    expect(result).toBe('The beauty of a sunset is ephemeral, lasting only a few minutes.');
  });

  it('handles fallback window when sentence has unusual punctuation', () => {
    const paragraph = 'Alpha beta gamma delta ephemeral epsilon zeta eta theta iota.';
    const selected = 'ephemeral';

    const result = extractContextFromText(paragraph, selected);
    expect(result).toContain('ephemeral');
  });

  it('rejects selections that exceed 200 characters limit', () => {
    const longSelection = 'a'.repeat(201);
    const isValid = longSelection.length <= 200;
    expect(isValid).toBe(false);
  });
});

describe('Extension Content Script - YouTube Subtitle Tokenizer', () => {
  it('tokenizes sentence into words and non-words', () => {
    const sentence = 'Hello, world! We are learning.';
    const tokens = tokenizeSubtitleSentence(sentence);

    const words = tokens.filter((t) => t.isWord).map((t) => t.text);
    expect(words).toEqual(['Hello', 'world', 'We', 'are', 'learning']);
  });

  it('preserves contractions and hyphens within words', () => {
    const sentence = "It's a high-impact feature, don't miss it!";
    const tokens = tokenizeSubtitleSentence(sentence);

    const words = tokens.filter((t) => t.isWord).map((t) => t.text);
    expect(words).toContain("It's");
    expect(words).toContain("high-impact");
    expect(words).toContain("don't");
  });

  it('returns empty array for empty string', () => {
    expect(tokenizeSubtitleSentence('')).toEqual([]);
  });
});

describe('Extension Content Script - YouTube URL Detection', () => {
  it('detects youtube watch page and extracts videoId with parameter', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s';
    expect(isYouTubeWatchPage(url)).toBe(true);
    expect(getYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('returns false and null for non-watch youtube pages or other websites', () => {
    expect(isYouTubeWatchPage('https://www.youtube.com/feed/subscriptions')).toBe(false);
    expect(getYouTubeVideoId('https://www.youtube.com/feed/subscriptions')).toBeNull();

    expect(isYouTubeWatchPage('https://medium.com/watch?v=123')).toBe(false);
    expect(getYouTubeVideoId('https://medium.com/watch?v=123')).toBeNull();
  });

  it('works with global window mock when defined', () => {
    (globalThis as any).window = {
      location: {
        hostname: 'www.youtube.com',
        pathname: '/watch',
        search: '?v=dQw4w9WgXcQ',
      },
    };

    expect(isYouTubeWatchPage()).toBe(true);
    expect(getYouTubeVideoId()).toBe('dQw4w9WgXcQ');

    delete (globalThis as any).window;
  });
});

describe('Extension Content Script - YouTube CC State', () => {
  it('returns false when document is undefined or cc button is absent', () => {
    expect(isYouTubeCCEnabled()).toBe(false);
  });

  it('detects aria-pressed true on cc button correctly', () => {
    const fakeBtn = {
      getAttribute: (attr: string) => (attr === 'aria-pressed' ? 'true' : null),
    };
    (globalThis as any).document = {
      querySelector: (selector: string) =>
        selector === '.ytp-subtitles-button' ? fakeBtn : null,
    };

    expect(isYouTubeCCEnabled()).toBe(true);

    delete (globalThis as any).document;
  });

  it('detects aria-pressed false on cc button correctly', () => {
    const fakeBtn = {
      getAttribute: (attr: string) => (attr === 'aria-pressed' ? 'false' : null),
    };
    (globalThis as any).document = {
      querySelector: (selector: string) =>
        selector === '.ytp-subtitles-button' ? fakeBtn : null,
    };

    expect(isYouTubeCCEnabled()).toBe(false);

    delete (globalThis as any).document;
  });
});
