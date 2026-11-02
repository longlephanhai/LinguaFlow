import { describe, expect, it, vi } from 'vitest';
import { ShadowingService } from './shadowing.service.js';

describe('ShadowingService', () => {
  const mockShadowingAttemptModel = {
    create: vi.fn(),
  };

  const mockAiService = {
    evaluateSpeech: vi.fn(),
  };

  const service = new ShadowingService(
    mockShadowingAttemptModel as any,
    mockAiService as any,
  );

  it('evaluates shadowing utterance and persists the attempt', async () => {
    mockAiService.evaluateSpeech.mockResolvedValue({
      overallScore: 88,
      transcribedText: 'The startup needs to scale its infrastructure.',
      wordsEvaluation: [
        { word: 'The', status: 'correct', phonemeFeedback: null },
        { word: 'startup', status: 'correct', phonemeFeedback: null },
      ],
      generalTips: 'Great cadence!',
    });
    mockShadowingAttemptModel.create.mockResolvedValue({ _id: 'att-1' });

    const result = await service.evaluate('507f1f77bcf86cd799439011', {
      targetText: 'The startup needs to scale its infrastructure.',
      userTranscript: 'The startup needs to scale its infrastructure.',
      videoId: 'vid-1',
      segmentIndex: 0,
    });

    expect(result).toEqual({
      overallScore: 88,
      transcribedText: 'The startup needs to scale its infrastructure.',
      wordsEvaluation: [
        { word: 'The', status: 'correct', phonemeFeedback: null },
        { word: 'startup', status: 'correct', phonemeFeedback: null },
      ],
      generalTips: 'Great cadence!',
    });

    expect(mockAiService.evaluateSpeech).toHaveBeenCalledWith(
      'The startup needs to scale its infrastructure.',
      'The startup needs to scale its infrastructure.',
      undefined,
    );
    expect(mockShadowingAttemptModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'vid-1',
        segmentIndex: 0,
        targetText: 'The startup needs to scale its infrastructure.',
        overallScore: 88,
      }),
    );
  });
});
