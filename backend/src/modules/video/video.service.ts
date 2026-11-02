import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetTranscriptDto } from './dto/get-transcript.dto.js';
import {
  TranscriptSegment,
  VideoTranscript,
} from './schemas/video-transcript.schema.js';

const INNERTUBE_CLIENT_VERSION = '20.10.38';

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

    if (cached && cached.segments && cached.segments.length > 0) {
      return {
        videoId: cached.videoId,
        provider: cached.provider,
        videoTitle: cached.videoTitle,
        durationSeconds: cached.durationSeconds,
        segments: cached.segments,
      };
    }

    // 2. Fetch real live transcript via YouTube InnerTube API (Android Client)
    const liveData = await this.fetchViaInnerTube(videoId, language);
    if (liveData && liveData.segments.length > 0) {
      const saved = await this.videoTranscriptModel.findOneAndUpdate(
        { provider: 'youtube', videoId, language },
        {
          provider: 'youtube',
          videoId,
          language,
          videoTitle: liveData.videoTitle,
          durationSeconds: liveData.durationSeconds,
          segments: liveData.segments,
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      );

      return {
        videoId: saved?.videoId || videoId,
        provider: saved?.provider || 'youtube',
        videoTitle: saved?.videoTitle || liveData.videoTitle,
        durationSeconds: saved?.durationSeconds || liveData.durationSeconds,
        segments: saved?.segments || liveData.segments,
      };
    }

    // 3. Fallback: Fetch via YouTube Watch page HTML (web scrape)
    const webData = await this.fetchViaWebScrape(videoId, language);
    if (webData && webData.segments.length > 0) {
      const saved = await this.videoTranscriptModel.findOneAndUpdate(
        { provider: 'youtube', videoId, language },
        {
          provider: 'youtube',
          videoId,
          language,
          videoTitle: webData.videoTitle,
          durationSeconds: webData.durationSeconds,
          segments: webData.segments,
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      );

      return {
        videoId: saved?.videoId || videoId,
        provider: saved?.provider || 'youtube',
        videoTitle: saved?.videoTitle || webData.videoTitle,
        durationSeconds: saved?.durationSeconds || webData.durationSeconds,
        segments: saved?.segments || webData.segments,
      };
    }

    throw new NotFoundException('Subtitles track contained no readable dialogue segments.');
  }

  /**
   * Fetches the authentic YouTube transcript using official InnerTube Android player API
   */
  private async fetchViaInnerTube(
    videoId: string,
    language: string,
  ): Promise<{ videoTitle: string; durationSeconds: number; segments: TranscriptSegment[] } | null> {
    try {
      const resp = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14)`,
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: INNERTUBE_CLIENT_VERSION,
            },
          },
          videoId,
        }),
      });

      if (!resp.ok) return null;
      const data = await resp.json();
      const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) {
        return null;
      }

      const videoTitle = data?.videoDetails?.title || 'YouTube Video';
      const durationSeconds = parseInt(data?.videoDetails?.lengthSeconds, 10) || 0;

      const track =
        captionTracks.find((t: any) => t.languageCode?.toLowerCase() === language && !t.vssId?.includes('asr')) ||
        captionTracks.find((t: any) => t.languageCode?.toLowerCase()?.startsWith(language)) ||
        captionTracks[0];

      const subRes = await fetch(track.baseUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
        },
      });

      if (!subRes.ok) return null;
      const subXml = await subRes.text();
      if (!subXml || subXml.length === 0) return null;

      const segments = this.parseXmlSubtitles(subXml);
      return { videoTitle, durationSeconds, segments };
    } catch {
      return null;
    }
  }

  /**
   * Fallback scraper from watch page
   */
  private async fetchViaWebScrape(
    videoId: string,
    language: string,
  ): Promise<{ videoTitle: string; durationSeconds: number; segments: TranscriptSegment[] } | null> {
    try {
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await fetch(watchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (!response.ok) return null;
      const pageHtml = await response.text();

      const playerResponseMatch =
        pageHtml.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var\s|let\s|const\s|<\/script>)/s) ||
        pageHtml.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);

      if (!playerResponseMatch) return null;

      const playerResponse = JSON.parse(playerResponseMatch[1]);
      const videoTitle = playerResponse?.videoDetails?.title || 'YouTube Video';
      const durationSeconds = parseInt(playerResponse?.videoDetails?.lengthSeconds, 10) || 0;

      const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) {
        return null;
      }

      const selectedTrack =
        captionTracks.find((t: any) => t.languageCode?.toLowerCase() === language) ||
        captionTracks.find((t: any) => t.languageCode?.toLowerCase()?.startsWith(language)) ||
        captionTracks[0];

      const subResponse = await fetch(selectedTrack.baseUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
        },
      });
      if (!subResponse.ok) return null;
      const subDataText = await subResponse.text();

      let segments: TranscriptSegment[] = [];
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
        // Fallback to XML
        segments = this.parseXmlSubtitles(subDataText);
      }

      if (segments.length === 0) {
        segments = this.parseXmlSubtitles(subDataText);
      }

      return { videoTitle, durationSeconds, segments };
    } catch {
      return null;
    }
  }

  private parseXmlSubtitles(xml: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    const regex =
      /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>|<text\s+start="([\d\.]+)"\s+dur="([\d\.]+)"[^>]*>([\s\S]*?)<\/text>/gi;
    let m: RegExpExecArray | null;
    let index = 0;

    while ((m = regex.exec(xml)) !== null) {
      let startSeconds: number;
      let endSeconds: number;
      let rawText: string;

      if (m[1] !== undefined) {
        startSeconds = Number((parseInt(m[1], 10) / 1000).toFixed(2));
        const dur = parseInt(m[2], 10) / 1000;
        endSeconds = Number((startSeconds + dur).toFixed(2));
        rawText = m[3];
      } else {
        startSeconds = Number(parseFloat(m[4]).toFixed(2));
        const dur = parseFloat(m[5]) || 0;
        endSeconds = Number((startSeconds + dur).toFixed(2));
        rawText = m[6];
      }

      const text = rawText
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n+/g, ' ')
        .trim();

      if (text) {
        segments.push({
          index: index++,
          startSeconds,
          endSeconds,
          text,
          translation: null,
        });
      }
    }

    return segments;
  }
}
