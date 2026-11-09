import { api } from './api';

export type ScenarioPreset = 'coffee_shop' | 'hotel_travel' | 'casual_chat' | 'job_interview' | 'custom';

export interface ScenarioTargetWord {
  id: string;
  lemma: string;
  meaning: string;
}

export interface DialogueTurn {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  detectedTargetWords?: string[];
  phrasingFeedback?: string | null;
}

export interface SpokenMetrics {
  totalWordsSpoken: number;
  speakingPaceWpm: number;
  fillerWordsCount: number;
  activationRate: number;
  conversationFluencyScore: number;
}

export interface StartVoiceSessionRequest {
  scenarioPreset?: string;
  topic?: string;
  targetWordsCount?: number;
}

export interface StartVoiceSessionResponse {
  sessionId: string;
  scenario: string;
  targetVocabulary: ScenarioTargetWord[];
  initialGreeting: string;
}

export interface VoiceTurnRequest {
  sessionId: string;
  userTranscript: string;
  userAudioBase64?: string;
}

export interface VoiceTurnResponse {
  assistantText: string;
  detectedTargetWords: string[];
  phrasingFeedback: string | null;
  targetWordsRemaining: string[];
}

export interface EndVoiceSessionRequest {
  sessionId: string;
}

export interface EndVoiceSessionResponse {
  sessionId: string;
  durationSeconds: number;
  spokenMetrics: SpokenMetrics;
  dialogueSummary: string;
  naturalPhrasingTips: string[];
  vocabularyMastered: string[];
}

export interface VoiceSessionHistoryItem {
  id: string;
  scenarioPreset: string;
  topic: string;
  durationSeconds: number;
  status: 'active' | 'completed';
  spokenMetrics: SpokenMetrics;
  dialogueSummary: string | null;
  turnsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceSessionsListResponse {
  items: VoiceSessionHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VoiceSessionDetailResponse {
  id: string;
  scenarioPreset: string;
  topic: string;
  durationSeconds: number;
  targetVocabulary: ScenarioTargetWord[];
  dialogueHistory: DialogueTurn[];
  spokenMetrics: SpokenMetrics;
  dialogueSummary: string | null;
  naturalPhrasingTips: string[];
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export const voiceApi = {
  startSession: async (payload: StartVoiceSessionRequest = {}): Promise<StartVoiceSessionResponse> => {
    const res = await api.post('/voice/start', payload);
    return res.data.data;
  },

  sendTurn: async (payload: VoiceTurnRequest): Promise<VoiceTurnResponse> => {
    const res = await api.post('/voice/turn', payload);
    return res.data.data;
  },

  endSession: async (payload: EndVoiceSessionRequest): Promise<EndVoiceSessionResponse> => {
    const res = await api.post('/voice/end', payload);
    return res.data.data;
  },

  getSessions: async (page = 1, limit = 10): Promise<VoiceSessionsListResponse> => {
    const res = await api.get('/voice/sessions', { params: { page, limit } });
    return res.data.data;
  },

  getSessionById: async (id: string): Promise<VoiceSessionDetailResponse> => {
    const res = await api.get(`/voice/sessions/${id}`);
    return res.data.data;
  },

  deleteSession: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/voice/sessions/${id}`);
    return res.data.data;
  },
};
