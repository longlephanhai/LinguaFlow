import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  AIProvider,
  ExplainInContextResult,
  QuizItemInput,
  GeneratedQuestion,
} from './ai-provider.interface.js';

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

  async generateQuiz(items: QuizItemInput[], count: number): Promise<GeneratedQuestion[]> {
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
You are an English language testing expert.
Generate exactly ${count} multiple-choice quiz questions based on the following vocabulary items and their sentence contexts:
${JSON.stringify(items, null, 2)}

Requirements:
1. For each question, select one vocabulary item from the list.
2. The question must test the meaning or contextual usage of the target word.
3. Provide EXACTLY 4 answer options (strings in an array of 4 items).
4. Provide correctIndex (integer 0, 1, 2, or 3) indicating which option is correct.
5. Provide a helpful, concise explanation for why that option is correct.
6. The occurrenceId must match the item's occurrenceId.

Respond ONLY with a valid JSON array of objects with this exact structure (no markdown, no backticks):
[
  {
    "occurrenceId": "string",
    "questionText": "What does 'scale' mean in the sentence: 'We need to scale the system'?",
    "options": ["Weigh", "Expand proportionally", "Climb", "Remove layers"],
    "correctIndex": 1,
    "explanation": "'scale' in this engineering context means to expand or grow proportionally."
  }
]
`;

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

        // 8s per-model timeout for quiz generation
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${model} request timeout after 8s`)), 8000),
        );

        const response = await Promise.race([callPromise, timeoutPromise]);
        let raw = response.text?.trim() || '[]';
        if (raw.startsWith('```json')) raw = raw.slice(7);
        if (raw.startsWith('```')) raw = raw.slice(3);
        if (raw.endsWith('```')) raw = raw.slice(0, -3);

        const parsed = JSON.parse(raw.trim());
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('AI returned non-array or empty questions');
        }

        // Validate and normalize questions
        const questions: GeneratedQuestion[] = [];
        for (const q of parsed) {
          if (!q.questionText || !Array.isArray(q.options) || q.options.length !== 4) {
            continue;
          }
          const correctIdx = typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
            ? q.correctIndex
            : 0;

          questions.push({
            occurrenceId: q.occurrenceId || items[questions.length % items.length].occurrenceId,
            questionText: String(q.questionText),
            options: [
              String(q.options[0]),
              String(q.options[1]),
              String(q.options[2]),
              String(q.options[3]),
            ],
            correctIndex: correctIdx,
            explanation: String(q.explanation || 'Correct answer based on the context.'),
          });
        }

        if (questions.length === 0) {
          throw new Error('No valid 4-option questions could be parsed from AI response');
        }

        return questions.slice(0, count);
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Model ${model} failed for quiz generation: ${err.message}. Trying next candidate...`);
      }
    }

    this.logger.error(`All candidate Gemini models failed for quiz generation. Last error: ${lastError?.message}`);
    throw new HttpException(
      {
        success: false,
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: lastError?.message || 'AI quiz generation failed',
        },
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
