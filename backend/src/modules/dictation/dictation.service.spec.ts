import { describe, expect, it, vi } from 'vitest';
import { DictationService } from './dictation.service.js';

describe('DictationService', () => {
  const mockDictationSessionModel = {
    create: vi.fn(),
  };

  const service = new DictationService(mockDictationSessionModel as any);

  it('records a dictation session successfully', async () => {
    const mockCreatedSession = {
      _id: { toString: () => 'session-123' },
      accuracyScore: 92,
      createdAt: new Date('2026-11-02T12:00:00.000Z'),
    };
    mockDictationSessionModel.create.mockResolvedValue(mockCreatedSession);

    const result = await service.recordSession('507f1f77bcf86cd799439011', {
      videoId: 'dQw4w9WgXcQ',
      completedSegments: 12,
      totalSegments: 15,
      accuracyScore: 92,
      timeSpentSeconds: 180,
      mistakesCount: 4,
    });

    expect(result).toEqual({
      sessionId: 'session-123',
      accuracyScore: 92,
      recordedAt: '2026-11-02T12:00:00.000Z',
    });
    expect(mockDictationSessionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'dQw4w9WgXcQ',
        completedSegments: 12,
        totalSegments: 15,
        accuracyScore: 92,
        timeSpentSeconds: 180,
        mistakesCount: 4,
      }),
    );
  });
});

