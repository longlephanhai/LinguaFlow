import { describe, expect, it, vi } from 'vitest';
import { ShadowingController } from './shadowing.controller.js';

describe('ShadowingController', () => {
  const mockShadowingService = {
    evaluate: vi.fn(),
  };

  const controller = new ShadowingController(mockShadowingService as any);

  it('delegates evaluate to ShadowingService with current userId', async () => {
    mockShadowingService.evaluate.mockResolvedValue({
      overallScore: 85,
      transcribedText: 'Hello world',
      wordsEvaluation: [],
      generalTips: 'Well done',
    });

    const user = { userId: '507f1f77bcf86cd799439011' };
    const dto = {
      targetText: 'Hello world',
      userTranscript: 'Hello world',
    };

    const res = await controller.evaluate(user, dto);

    expect(res).toEqual({
      overallScore: 85,
      transcribedText: 'Hello world',
      wordsEvaluation: [],
      generalTips: 'Well done',
    });
    expect(mockShadowingService.evaluate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', dto);
  });
});
