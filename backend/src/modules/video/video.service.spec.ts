import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VideoService } from './video.service.js';

describe('VideoService', () => {
  let service: VideoService;
  let mockVideoTranscriptModel: any;

  beforeEach(() => {
    mockVideoTranscriptModel = {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
    };

    service = new VideoService(mockVideoTranscriptModel as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractYouTubeVideoId', () => {
    it('should extract ID from standard watch URL', () => {
      expect(
        service.extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID with query params', () => {
      expect(
        service.extractYouTubeVideoId('https://www.youtube.com/watch?t=10s&v=dQw4w9WgXcQ&feature=share'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from youtu.be short URL', () => {
      expect(
        service.extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=4'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from embed and shorts URLs', () => {
      expect(
        service.extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
      ).toBe('dQw4w9WgXcQ');
      expect(
        service.extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should accept raw 11-char video ID', () => {
      expect(service.extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      expect(service.extractYouTubeVideoId('https://example.com/video')).toBeNull();
      expect(service.extractYouTubeVideoId('')).toBeNull();
    });
  });

  describe('getTranscript', () => {
    it('should throw BadRequestException if URL is invalid', async () => {
      await expect(
        service.getTranscript({ videoUrl: 'https://example.com/not-youtube' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return cached transcript if found in DB', async () => {
      const cached = {
        videoId: 'dQw4w9WgXcQ',
        provider: 'youtube',
        videoTitle: 'Test Video',
        durationSeconds: 212,
        segments: [
          { index: 0, startSeconds: 1.0, endSeconds: 3.5, text: 'Never gonna give you up', translation: null },
        ],
      };

      mockVideoTranscriptModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(cached),
      });

      const result = await service.getTranscript({
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });

      expect(result).toEqual(cached);
      expect(mockVideoTranscriptModel.findOne).toHaveBeenCalledWith({
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        language: 'en',
      });
    });

    it('should fetch, parse and cache YouTube subtitles when not cached', async () => {
      mockVideoTranscriptModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const playerResponse = {
        videoDetails: {
          title: 'Rick Astley - Never Gonna Give You Up',
          lengthSeconds: '212',
        },
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              {
                baseUrl: 'https://www.youtube.com/api/timedtext?v=dQw4w9WgXcQ',
                languageCode: 'en',
                name: { simpleText: 'English' },
              },
            ],
          },
        },
      };

      const htmlPage = `<html><head><script>var ytInitialPlayerResponse = ${JSON.stringify(playerResponse)};</script></head></html>`;

      const json3Subtitles = {
        events: [
          {
            tStartMs: 1200,
            dDurationMs: 2500,
            segs: [{ utf8: 'Never gonna ' }, { utf8: 'give you up' }],
          },
          {
            tStartMs: 4000,
            dDurationMs: 2000,
            segs: [{ utf8: 'Never gonna let you down' }],
          },
        ],
      };

      const globalFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('youtube.com/watch')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: () => Promise.resolve(htmlPage),
          });
        }
        if (url.includes('timedtext')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify(json3Subtitles)),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      vi.stubGlobal('fetch', globalFetch);

      mockVideoTranscriptModel.findOneAndUpdate.mockResolvedValue({
        videoId: 'dQw4w9WgXcQ',
        provider: 'youtube',
        videoTitle: 'Rick Astley - Never Gonna Give You Up',
        durationSeconds: 212,
        segments: [
          { index: 0, startSeconds: 1.2, endSeconds: 3.7, text: 'Never gonna give you up', translation: null },
          { index: 1, startSeconds: 4.0, endSeconds: 6.0, text: 'Never gonna let you down', translation: null },
        ],
      });

      const result = await service.getTranscript({
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        language: 'en',
      });

      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.videoTitle).toBe('Rick Astley - Never Gonna Give You Up');
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].text).toBe('Never gonna give you up');
      expect(mockVideoTranscriptModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should fallback to XML subtitle parsing if JSON3 parse fails', async () => {
      mockVideoTranscriptModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const playerResponse = {
        videoDetails: { title: 'XML Subtitles Video', lengthSeconds: '100' },
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              {
                baseUrl: 'https://www.youtube.com/api/timedtext?v=xmlVideo123',
                languageCode: 'en',
              },
            ],
          },
        },
      };

      const htmlPage = `ytInitialPlayerResponse = ${JSON.stringify(playerResponse)};`;
      const xmlSubtitles = `
        <transcript>
          <text start="1.5" dur="2.5">Learning English &amp; vocabulary</text>
          <text start="4.2" dur="3.0">Is very easy and fun</text>
        </transcript>
      `;

      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('youtube.com/watch')) {
            return Promise.resolve({
              ok: true,
              text: () => Promise.resolve(htmlPage),
            });
          }
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(xmlSubtitles),
          });
        }),
      );

      mockVideoTranscriptModel.findOneAndUpdate.mockImplementation((_, update) =>
        Promise.resolve(update),
      );

      const result = await service.getTranscript({
        videoUrl: 'https://youtu.be/xmlVideo123',
      });

      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].text).toBe('Learning English & vocabulary');
      expect(result.segments[1].text).toBe('Is very easy and fun');
    });

    it('should throw NotFoundException if video has no captions', async () => {
      mockVideoTranscriptModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const playerResponse = {
        videoDetails: { title: 'No Captions Video', lengthSeconds: '50' },
        captions: null,
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(`ytInitialPlayerResponse = ${JSON.stringify(playerResponse)};`),
        }),
      );

      await expect(
        service.getTranscript({ videoUrl: 'https://youtu.be/noCaption12' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
