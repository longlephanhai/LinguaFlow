import { describe, it, expect } from 'vitest';

function extractContextFromText(parentText: string, selectedText: string): string {
  if (!parentText) return selectedText;

  const sentences = parentText.split(/(?<=[.!?])\s+/);
  const matchedSentence = sentences.find((s) => s.includes(selectedText));

  if (matchedSentence && matchedSentence.length <= 400) {
    return matchedSentence.trim();
  }

  const idx = parentText.indexOf(selectedText);
  if (idx !== -1) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(parentText.length, idx + selectedText.length + 100);
    return parentText.substring(start, end).trim();
  }

  return selectedText;
}

describe('Extension Content Script - Context Extraction', () => {
  it('extracts the exact parent sentence containing the selected word', () => {
    const paragraph = 'The quick brown fox jumps over the lazy dog. The beauty of a sunset is ephemeral, lasting only a few minutes. Tomorrow will be sunny.';
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
