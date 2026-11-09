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
  startSession: (payload: StartVoiceSessionRequest = {}): Promise<StartVoiceSessionResponse> => {
    return api.post('/voice/start', payload) as unknown as Promise<StartVoiceSessionResponse>;
  },

  sendTurn: (payload: VoiceTurnRequest): Promise<VoiceTurnResponse> => {
    return api.post('/voice/turn', payload) as unknown as Promise<VoiceTurnResponse>;
  },

  endSession: (payload: EndVoiceSessionRequest): Promise<EndVoiceSessionResponse> => {
    return api.post('/voice/end', payload) as unknown as Promise<EndVoiceSessionResponse>;
  },

  getSessions: (page = 1, limit = 10): Promise<VoiceSessionsListResponse> => {
    return api.get('/voice/sessions', { params: { page, limit } }) as unknown as Promise<VoiceSessionsListResponse>;
  },

  getSessionById: (id: string): Promise<VoiceSessionDetailResponse> => {
    return api.get(`/voice/sessions/${id}`) as unknown as Promise<VoiceSessionDetailResponse>;
  },

  deleteSession: (id: string): Promise<{ success: boolean }> => {
    return api.delete(`/voice/sessions/${id}`) as unknown as Promise<{ success: boolean }>;
  },
};

