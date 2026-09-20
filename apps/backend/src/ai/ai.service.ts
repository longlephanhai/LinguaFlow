import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiExplainResultDto, AiProviderError } from '@linguaflow/shared-types';
import type { ChatMessageDto, QuizQuestionDto, WritingFeedbackDto } from '@linguaflow/shared-types';

/**
 * AIProvider interface — provider-agnostic contract.
 * See ARCHITECTURE.md §6.
 * Swapping Gemini for another provider = writing a new class implementing this interface.
 */
export interface AIProvider {
  explainInContext(selectedText: string, contextText: string): Promise<AiExplainResultDto>;
  generateQuiz(occurrenceIds: string[], count: number): Promise<QuizQuestionDto[]>;
  chat(history: ChatMessageDto[], message: string): Promise<string>;
  reviewWriting(text: string): Promise<WritingFeedbackDto>;
}

/**
 * AiService — the ONLY service allowed to call the Gemini SDK.
 * All AI calls MUST have a timeout and a fallback error path (PROJECT-RULES.md).
 * API key is read from ConfigService — NEVER hardcoded.
 */
@Injectable()
export class AiService implements AIProvider {
  constructor(private readonly config: ConfigService) {}

  // TODO: Implement GeminiProvider logic here
  // GEMINI_API_KEY = this.config.get<string>('GEMINI_API_KEY')

  async explainInContext(
    _selectedText: string,
    _contextText: string,
  ): Promise<AiExplainResultDto> {
    // TODO: Call Gemini SDK, enforce timeout, return AI_PROVIDER_ERROR on failure
    throw new Error('Not implemented');
  }

  async generateQuiz(_occurrenceIds: string[], _count: number): Promise<QuizQuestionDto[]> {
    // TODO: Call Gemini SDK, enforce timeout, return AI_PROVIDER_ERROR on failure
    throw new Error('Not implemented');
  }

  async chat(_history: ChatMessageDto[], _message: string): Promise<string> {
    // TODO: Call Gemini SDK, enforce timeout, return AI_PROVIDER_ERROR on failure
    throw new Error('Not implemented');
  }

  async reviewWriting(_text: string): Promise<WritingFeedbackDto> {
    // TODO: Call Gemini SDK, enforce timeout, return AI_PROVIDER_ERROR on failure
    throw new Error('Not implemented');
  }
}
