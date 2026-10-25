import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AIProvider, ExplainInContextResult } from './ai-provider.interface.js';

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenAI | null = null;
  private readonly primaryModel: string;

  constructor(private readonly configService: ConfigService) {
    this.primaryModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-flash-lite-latest';
    this.initClient();
  }

  private initClient(): GoogleGenAI | null {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.client = new GoogleGenAI({ apiKey });
      return this.client;
    }
    return null;
  }

  async explainInContext(selectedText: string, contextText: string): Promise<ExplainInContextResult> {
    const client = this.client || this.initClient();
    if (!client) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'AI_PROVIDER_ERROR',
            message: 'Gemini API key is not configured in backend/.env.',
          },
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    const prompt = `
You are a language learning assistant.
Analyze the following highlighted word and its context:
- Word: "${selectedText}"
- Context sentence: "${contextText}"

Respond ONLY with valid JSON with this exact structure:
{
  "lemma": "base/dictionary form of the word in lowercase",
  "meaning": "clear Vietnamese definition explaining how this word is used in this specific context sentence",
  "example": "a natural, illustrative English sentence using the word in the same sense",
  "partOfSpeech": "noun | verb | adjective | adverb | idiom | phrase"
}
`;

    // Resilient candidate list: try fast lightweight models first, then fallback to alternatives
    const candidateModels = Array.from(
      new Set([
        this.primaryModel,
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash',
      ]),
    );

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const callPromise = client.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        // 5s per-model timeout so we quickly failover if a model is throttled or hanging
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${model} request timeout after 5s`)), 5000),
        );

        const response = await Promise.race([callPromise, timeoutPromise]);
        let raw = response.text?.trim() || '{}';
        // Strip code fence if present
        if (raw.startsWith('```json')) raw = raw.slice(7);
        if (raw.startsWith('```')) raw = raw.slice(3);
        if (raw.endsWith('```')) raw = raw.slice(0, -3);
        const parsed = JSON.parse(raw.trim());

        return {
          lemma: parsed.lemma || selectedText.toLowerCase(),
          meaning: parsed.meaning || '',
          example: parsed.example || contextText,
          partOfSpeech: parsed.partOfSpeech || undefined,
        };
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Model ${model} failed: ${err.message}. Trying next candidate...`);
      }
    }

    this.logger.error(`All candidate Gemini models failed. Last error: ${lastError?.message}`);
    throw new HttpException(
      {
        success: false,
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: lastError?.message || 'AI explanation service failed',
        },
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
