// AI-related DTOs — used by AiModule internally and shared with quiz/chat/writing consumers
// See ARCHITECTURE.md §6 — AIProvider interface

export interface AiExplainResultDto {
  meaning: string;
  example: string;
}

// Error code returned by AiModule on failure (see API-CONTRACTS.md)
export const AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR' as const;
export type AiProviderError = typeof AI_PROVIDER_ERROR;
