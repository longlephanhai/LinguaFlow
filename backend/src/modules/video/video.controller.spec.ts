import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoController } from './video.controller.js';
import { VideoService } from './video.service.js';

describe('VideoController', () => {
  let controller: VideoController;
  let mockVideoService: any;

  beforeEach(() => {
    mockVideoService = {
      getTranscript: vi.fn(),
    };

    controller = new VideoController(mockVideoService as VideoService);
  });

  describe('POST /video/transcript', () => {
    it('should delegate to videoService.getTranscript', async () => {
      const dto = { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', language: 'en' };
      const expectedResult = {
        videoId: 'dQw4w9WgXcQ',
        provider: 'youtube',
        videoTitle: 'Test Video',
        durationSeconds: 212,
        segments: [],
      };

      mockVideoService.getTranscript.mockResolvedValue(expectedResult);

      const result = await controller.getTranscript(dto);

      expect(mockVideoService.getTranscript).toHaveBeenCalledWith(dto);
      expect(result).toBe(expectedResult);
    });
  });
});
