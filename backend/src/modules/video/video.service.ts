import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetTranscriptDto } from './dto/get-transcript.dto.js';
import {
  TranscriptSegment,
  VideoTranscript,
} from './schemas/video-transcript.schema.js';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(VideoTranscript.name)
    private readonly videoTranscriptModel: Model<VideoTranscript>,
  ) {}

  extractYouTubeVideoId(urlOrId: string): string | null {
    if (!urlOrId || typeof urlOrId !== 'string') return null;
    const trimmed = urlOrId.trim();

    // Direct 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    const patterns = [
      /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  async getTranscript(dto: GetTranscriptDto) {
    const videoId = this.extractYouTubeVideoId(dto.videoUrl);
    if (!videoId) {
      throw new BadRequestException('Invalid YouTube URL or video ID.');
    }

    const language = (dto.language || 'en').toLowerCase().trim();

    // 1. Check database cache
    const cached = await this.videoTranscriptModel
      .findOne({ provider: 'youtube', videoId, language })
      .lean();

    if (cached) {
      return {
        videoId: cached.videoId,
        provider: cached.provider,
        videoTitle: cached.videoTitle,
        durationSeconds: cached.durationSeconds,
        segments: cached.segments,
      };
    }

    // 2. Fetch YouTube watch page
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    let pageHtml = '';
    try {
      const response = await fetch(watchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      pageHtml = await response.text();
    } catch (err: any) {
      throw new BadRequestException(`Unable to fetch YouTube video: ${err.message}`);
    }

    // 3. Extract player response JSON
    const playerResponseMatch =
      pageHtml.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var\s|let\s|const\s|<\/script>)/s) ||
      pageHtml.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);

    if (!playerResponseMatch) {
      throw new NotFoundException('Could not parse YouTube player metadata.');
    }

    let playerResponse: any;
    try {
      playerResponse = JSON.parse(playerResponseMatch[1]);
    } catch {
      throw new NotFoundException('Invalid player metadata format.');
    }

    const videoTitle =
      playerResponse?.videoDetails?.title || 'YouTube Video';
    const durationSeconds =
      parseInt(playerResponse?.videoDetails?.lengthSeconds, 10) || 0;

    const captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new NotFoundException('No subtitles found for this video.');
    }

    // 4. Select matching track
    const selectedTrack =
      captionTracks.find((t: any) => t.languageCode?.toLowerCase() === language) ||
      captionTracks.find((t: any) => t.languageCode?.toLowerCase()?.startsWith(language)) ||
      captionTracks[0];

    const subtitleUrl = selectedTrack.baseUrl.includes('fmt=json3')
      ? selectedTrack.baseUrl
      : `${selectedTrack.baseUrl}&fmt=json3`;

    let segments: TranscriptSegment[] = [];

    try {
      const subResponse = await fetch(subtitleUrl);
      const subDataText = await subResponse.text();

      try {
        const json3 = JSON.parse(subDataText);
        if (json3.events && Array.isArray(json3.events)) {
          let segIndex = 0;
          for (const ev of json3.events) {
            if (!ev.segs || !Array.isArray(ev.segs)) continue;
            const text = ev.segs
              .map((s: any) => s.utf8 || '')
              .join('')
              .replace(/\n+/g, ' ')
              .trim();
            if (!text || text === '\n') continue;

            const startSeconds = Number((ev.tStartMs / 1000).toFixed(2));
            const dur = (ev.dDurationMs || 0) / 1000;
            const endSeconds = Number((startSeconds + dur).toFixed(2));

            segments.push({
              index: segIndex++,
              startSeconds,
              endSeconds,
              text,
              translation: null,
            });
          }
        }
      } catch {
        // Fallback: Parse XML format if response was XML
        segments = this.parseXmlSubtitles(subDataText);
      }
    } catch (err: any) {
      throw new BadRequestException(`Failed to retrieve subtitle stream: ${err.message}`);
    }

    if (segments.length === 0) {
      throw new NotFoundException('Subtitles track contained no readable dialogue segments.');
    }

    // 5. Cache transcript in DB
    const saved = await this.videoTranscriptModel.findOneAndUpdate(
      { provider: 'youtube', videoId, language },
      {
        provider: 'youtube',
        videoId,
        language,
        videoTitle,
        durationSeconds,
        segments,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return {
      videoId: saved.videoId,
      provider: saved.provider,
      videoTitle: saved.videoTitle,
      durationSeconds: saved.durationSeconds,
      segments: saved.segments,
    };
  }

  private parseXmlSubtitles(xml: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    const regex = /<text\s+start="([0-9.]+)"\s+dur="([0-9.]+)"[^>]*>(.*?)<\/text>/gi;
    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = regex.exec(xml)) !== null) {
      const startSeconds = parseFloat(match[1]);
      const dur = parseFloat(match[2]);
      const rawText = match[3]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n+/g, ' ')
        .trim();

      if (rawText) {
        segments.push({
          index: index++,
          startSeconds: Number(startSeconds.toFixed(2)),
          endSeconds: Number((startSeconds + dur).toFixed(2)),
          text: rawText,
          translation: null,
        });
      }
    }

    return segments;
  }
}
