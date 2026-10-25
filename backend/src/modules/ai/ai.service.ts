import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { AI_PROVIDER_TOKEN } from './ai-provider.interface.js';
import type { AIProvider } from './ai-provider.interface.js';
import { AiCache } from './schemas/ai-cache.schema.js';

export interface LookupResult {
  lemma: string;
  meaning: string;
  example: string;
  partOfSpeech?: string | null;
  cached: boolean;
}

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: AIProvider,
    @InjectModel(AiCache.name)
    private readonly aiCacheModel: Model<AiCache>,
  ) {}

  async lookupInContext(selectedText: string, contextText: string): Promise<LookupResult> {
    const cleanWord = selectedText.trim().toLowerCase();
    const cleanContext = contextText.trim();
    const hash = crypto
      .createHash('sha256')
      .update(`${cleanWord}|${cleanContext}`)
      .digest('hex');

    // 1. Check AI cache first (avoid paying Gemini twice for same sentence context)
    const cached = await this.aiCacheModel.findOne({ hash });
    if (cached) {
      return {
        lemma: cached.lemma || cleanWord,
        meaning: cached.meaning,
        example: cached.example,
        partOfSpeech: cached.partOfSpeech,
        cached: true,
      };
    }

    // 2. Call AI provider
    const aiResult = await this.aiProvider.explainInContext(cleanWord, cleanContext);

    // 3. Persist to cache
    await this.aiCacheModel.create({
      hash,
      lemma: aiResult.lemma,
      meaning: aiResult.meaning,
      example: aiResult.example,
      partOfSpeech: aiResult.partOfSpeech || null,
      aiModel: 'gemini-2.0-flash',
    });

    return {
      lemma: aiResult.lemma,
      meaning: aiResult.meaning,
      example: aiResult.example,
      partOfSpeech: aiResult.partOfSpeech || null,
      cached: false,
    };
  }

  async generateQuiz(items: import('./ai-provider.interface.js').QuizItemInput[], count: number) {
    return this.aiProvider.generateQuiz(items, count);
  }
}
