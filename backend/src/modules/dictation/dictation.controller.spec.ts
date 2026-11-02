import { describe, expect, it, vi } from 'vitest';
import { DictationController } from './dictation.controller.js';

describe('DictationController', () => {
  const mockDictationService = {
    recordSession: vi.fn(),
  };

  const controller = new DictationController(mockDictationService as any);

  it('delegates recordSession to DictationService with userId', async () => {
    mockDictationService.recordSession.mockResolvedValue({
      sessionId: 'session-456',
      accuracyScore: 95,
      recordedAt: '2026-11-02T12:00:00.000Z',
    });

    const user = { userId: '507f1f77bcf86cd799439011' };
    const dto = {
      videoId: 'vid-123',
      completedSegments: 5,
      totalSegments: 5,
      accuracyScore: 95,
      timeSpentSeconds: 60,
      mistakesCount: 1,
    };

    const res = await controller.recordSession(user, dto);

    expect(res).toEqual({
      sessionId: 'session-456',
      accuracyScore: 95,
      recordedAt: '2026-11-02T12:00:00.000Z',
    });
    expect(mockDictationService.recordSession).toHaveBeenCalledWith('507f1f77bcf86cd799439011', dto);
  });
});

