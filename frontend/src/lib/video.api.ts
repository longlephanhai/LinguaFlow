import { api } from './api';

export interface TranscriptSegment {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  translation?: string | null;
}

export interface VideoTranscriptData {
  videoId: string;
  provider: 'youtube' | 'netflix' | string;
  videoTitle: string;
  durationSeconds: number;
  segments: TranscriptSegment[];
}

export interface GetTranscriptPayload {
  videoUrl: string;
  language?: string;
}

export const videoApi = {
  getTranscript: async (payload: GetTranscriptPayload): Promise<VideoTranscriptData> => {
    return api.post('/video/transcript', payload) as unknown as Promise<VideoTranscriptData>;
  },
};
