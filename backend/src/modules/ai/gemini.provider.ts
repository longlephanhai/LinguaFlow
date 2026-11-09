import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  AIProvider,
  ExplainInContextResult,
  QuizItemInput,
  GeneratedQuestion,
  ChatMessageItem,
  WritingReviewResult,
  WordSpeechEvaluation,
  SpeechEvaluationResult,
  DiscoveredVocabularyItem,
  ScenarioTargetWord,
  ScenarioGreetingResult,
  ScenarioTurnResult,
  ScenarioSessionSummaryResult,
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

  async chat(history: ChatMessageItem[], message: string, userVocabulary?: string[]): Promise<string> {
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

    const vocabContext = userVocabulary && userVocabulary.length > 0
      ? `The user is practicing these English vocabulary words: [${userVocabulary.join(', ')}]. Whenever natural and appropriate, gently weave some of these words into your answers or prompt the user to try using them.`
      : '';

    const systemInstruction = `You are a friendly, encouraging English tutor and conversation partner in the LinguaFlow language app.
Your goals:
1. Converse naturally, engagingly, and helpfully in English with the learner.
2. If the user makes grammatical, spelling, or unnatural phrasing mistakes in their message, provide a gentle, brief inline correction (e.g., "*Tip: Consider saying '...' instead of '...' for natural phrasing*") and then reply conversationally.
3. Keep responses conversational, concise, and end with an engaging follow-up thought or question when appropriate.
${vocabContext}`;

    // Limit conversation history to the last 15 messages for optimal prompt size and context
    const recentHistory = (history || []).slice(-15);
    const formattedHistory = recentHistory
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${systemInstruction}

Conversation History:
${formattedHistory ? formattedHistory + '\n\n' : ''}User: ${message}
Assistant:`;

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
        });

        // 8s per-model timeout for chat response
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${model} request timeout after 8s`)), 8000),
        );

        const response = await Promise.race([callPromise, timeoutPromise]);
        let reply = response.text?.trim() || '';

        // EDGE-012: Truncate response if > 5000 chars
        if (reply.length > 5000) {
          reply = reply.slice(0, 5000) + '... (response truncated)';
        }

        return reply;
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Model ${model} failed for chat: ${err.message}. Trying next candidate...`);
      }
    }

    this.logger.error(`All candidate Gemini models failed for chat. Last error: ${lastError?.message}`);
    throw new HttpException(
      {
        success: false,
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: lastError?.message || 'AI chat response failed',
        },
      },
      HttpStatus.BAD_GATEWAY,
    );
  }

  async reviewWriting(text: string): Promise<WritingReviewResult> {
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

    const prompt = `You are an expert English writing tutor and editor in LinguaFlow.
Analyze the following English text written by a language learner:

"""
${text}
"""

Evaluate the writing on grammar, syntax, vocabulary choice, clarity, and overall flow.
Provide constructive, motivating, and specific feedback.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "feedback": "A clear, cohesive prose commentary summarizing the overall strengths, tone, and main areas for improvement (2 to 4 sentences).",
  "suggestions": [
    "Specific actionable point identifying a mistake or awkward phrasing, explaining why, and offering a revised example sentence."
  ]
}`;

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

        // 10s per-model timeout for writing review
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${model} request timeout after 10s`)), 10000),
        );

        const response = await Promise.race([callPromise, timeoutPromise]);
        let raw = response.text?.trim() || '{}';
        if (raw.startsWith('```json')) raw = raw.slice(7);
        if (raw.startsWith('```')) raw = raw.slice(3);
        if (raw.endsWith('```')) raw = raw.slice(0, -3);

        const parsed = JSON.parse(raw.trim());

        let feedback = String(parsed.feedback || 'Your writing has been reviewed. Keep practicing!');
        // EDGE-012: Truncate response if > 5000 chars
        if (feedback.length > 5000) {
          feedback = feedback.slice(0, 5000) + '... (response truncated)';
        }

        const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
        const suggestions: string[] = rawSuggestions
          .map((s: any) => String(s).trim())
          .filter((s: string) => s.length > 0)
          .slice(0, 10);

        if (suggestions.length === 0) {
          suggestions.push('No critical grammatical errors found. Great work!');
        }

        return {
          feedback,
          suggestions,
          aiModel: model,
        };
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Model ${model} failed for writing review: ${err.message}. Trying next candidate...`);
      }
    }

    this.logger.error(`All candidate Gemini models failed for writing review. Last error: ${lastError?.message}`);
    throw new HttpException(
      {
        success: false,
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: lastError?.message || 'AI writing review failed',
        },
      },
      HttpStatus.BAD_GATEWAY,
    );
  }

  async evaluateSpeech(
    targetText: string,
    userTranscript: string,
    userAudioBase64?: string,
  ): Promise<SpeechEvaluationResult> {
    const client = this.client || this.initClient();
    const cleanTarget = targetText.trim();
    const cleanTranscript = (userTranscript || '').trim();

    if (!client) {
      // Offline fallback comparison if no Gemini API key
      return this.fallbackEvaluateSpeech(cleanTarget, cleanTranscript);
    }

    const prompt = `
You are an expert English pronunciation, intonation, and speech assessment coach.
The student is shadowing a target dialogue sentence from a video.

Target reference sentence: "${cleanTarget}"
Student transcribed speech: "${cleanTranscript || '(no audio or silent)'}"

Evaluate the student's pronunciation, word completeness, and speech accuracy:
1. "overallScore": an integer from 0 to 100 representing overall pronunciation and speech accuracy.
2. "transcribedText": the transcribed student utterance (clean string).
3. "wordsEvaluation": an array analyzing each word in the target sentence in original sequential order:
   - "word": string (the exact target word, without leading/trailing punctuation)
   - "status": "correct" | "minor_error" | "mispronounced" | "omitted"
   - "phonemeFeedback": specific feedback string (e.g. "Missing final /z/ sound", "Vowel too short", or "Stress first syllable") or null if correct.
4. "generalTips": a constructive 1-2 sentence tip on how the student can improve their pacing, intonation, or stress for this cue.

Respond ONLY with a valid JSON object matching the schema above.
`;

    const candidateModels = Array.from(
      new Set([
        this.primaryModel,
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-flash-latest',
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

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${model} speech evaluation timeout after 10s`)), 10000),
        );

        const response = await Promise.race([callPromise, timeoutPromise]);
        let raw = response.text?.trim() || '{}';
        if (raw.startsWith('```json')) raw = raw.slice(7);
        if (raw.startsWith('```')) raw = raw.slice(3);
        if (raw.endsWith('```')) raw = raw.slice(0, -3);

        const parsed = JSON.parse(raw.trim());

        const score = typeof parsed.overallScore === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.overallScore)))
          : 75;

        const transcribedText = String(parsed.transcribedText || cleanTranscript || cleanTarget);
        const generalTips = String(parsed.generalTips || 'Good job shadowing! Practice linking words smoothly.');

        const rawWords = Array.isArray(parsed.wordsEvaluation) ? parsed.wordsEvaluation : [];
        const wordsEvaluation: WordSpeechEvaluation[] = rawWords.map((item: any) => ({
          word: String(item.word || ''),
          status: ['correct', 'minor_error', 'mispronounced', 'omitted'].includes(item.status)
            ? item.status
            : 'correct',
          phonemeFeedback: item.phonemeFeedback ? String(item.phonemeFeedback) : null,
        }));

        if (wordsEvaluation.length === 0) {
          return this.fallbackEvaluateSpeech(cleanTarget, cleanTranscript);
        }

        return {
          overallScore: score,
          transcribedText,
          wordsEvaluation,
          generalTips,
        };
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Model ${model} failed for speech evaluation: ${err.message}. Trying next candidate...`);
      }
    }

    this.logger.warn(`All candidate Gemini models failed for speech evaluation: ${lastError?.message}. Using algorithmic fallback.`);
    return this.fallbackEvaluateSpeech(cleanTarget, cleanTranscript);
  }

  private fallbackEvaluateSpeech(targetText: string, userTranscript: string): SpeechEvaluationResult {
    const targetWords = targetText
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const spokenWords = userTranscript
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    let matchCount = 0;
    const wordsEvaluation: WordSpeechEvaluation[] = targetWords.map((word, idx) => {
      const cleanWord = word.toLowerCase();
      const spokenWord = spokenWords[idx];

      if (spokenWord === cleanWord) {
        matchCount++;
        return {
          word,
          status: 'correct',
          phonemeFeedback: null,
        };
      } else if (spokenWord && (spokenWord.includes(cleanWord) || cleanWord.includes(spokenWord))) {
        matchCount += 0.7;
        return {
          word,
          status: 'minor_error',
          phonemeFeedback: 'Slight pronunciation difference',
        };
      } else if (!spokenWord) {
        return {
          word,
          status: 'omitted',
          phonemeFeedback: 'Word was omitted',
        };
      } else {
        return {
          word,
          status: 'mispronounced',
          phonemeFeedback: `Sounds like "${spokenWord}"`,
        };
      }
    });

    const calculatedScore = targetWords.length > 0
      ? Math.round((matchCount / targetWords.length) * 100)
      : 80;

    return {
      overallScore: Math.max(0, Math.min(100, calculatedScore)),
      transcribedText: userTranscript || targetText,
      wordsEvaluation,
      generalTips: calculatedScore >= 80
        ? 'Great pronunciation and pacing! Keep it up.'
        : 'Focus on enunciating each consonant clearly and matching the speaker rhythm.',
    };
  }

  async extractVocabularyFromText(
    text: string,
    count: number = 6,
  ): Promise<DiscoveredVocabularyItem[]> {
    const client = this.client || this.initClient();
    if (!client) {
      // Fallback: extract several interesting candidate words without AI if API key is not configured
      return this.fallbackExtractVocabulary(text, count);
    }

    const truncated = text.length > 5000 ? text.slice(0, 5000) : text;

    const prompt = `
You are an expert English language reading tutor.
Analyze this reading passage and select ${count} valuable, interesting, or commonly misunderstood vocabulary words or phrasal verbs (aiming for intermediate / practical B1-B2 level words).
Do NOT pick trivial basic words like "the", "have", "make", "good", "people".

For each selected item:
- "lemma": the base dictionary form in lowercase (e.g. "ubiquitous", "leverage", "turn out")
- "partOfSpeech": "noun" | "verb" | "adjective" | "adverb" | "phrasal verb"
- "contextSentence": the exact or cleaned full sentence from the passage where this word appears
- "definition": a clear, helpful Vietnamese definition explaining this word's meaning in this context

Respond ONLY with a valid JSON array matching this structure:
[
  {
    "lemma": "...",
    "partOfSpeech": "...",
    "contextSentence": "...",
    "definition": "..."
  }
]

Passage:
"""
${truncated}
"""
`.trim();

    try {
      const response = await client.models.generateContent({
        model: this.primaryModel,
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '[]';
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => ({
          lemma: String(item.lemma || '').trim().toLowerCase(),
          partOfSpeech: String(item.partOfSpeech || 'noun').trim(),
          contextSentence: String(item.contextSentence || '').trim(),
          definition: String(item.definition || '').trim(),
        })).filter((item) => item.lemma && item.contextSentence && item.definition);
      }
      return this.fallbackExtractVocabulary(text, count);
    } catch (err) {
      this.logger.warn(`Gemini vocabulary extraction failed, using fallback: ${err}`);
      return this.fallbackExtractVocabulary(text, count);
    }
  }

  private fallbackExtractVocabulary(text: string, count: number): DiscoveredVocabularyItem[] {
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const candidates: DiscoveredVocabularyItem[] = [];
    const seen = new Set<string>();

    for (const sentence of sentences) {
      const words = sentence
        .replace(/[^a-zA-Z\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 6);

      for (const w of words) {
        const lower = w.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          candidates.push({
            lemma: lower,
            partOfSpeech: 'vocabulary',
            contextSentence: sentence,
            definition: `Ý nghĩa theo ngữ cảnh của "${lower}"`,
          });
          break;
        }
      }
      if (candidates.length >= count) break;
    }

    return candidates;
  }

  async generateScenarioGreeting(
    scenarioPreset: string,
    topic?: string,
    targetVocabulary?: ScenarioTargetWord[],
    proficiencyLevel: string = 'a1_a2',
  ): Promise<ScenarioGreetingResult> {
    const client = this.client || this.initClient();
    if (!client) {
      return this.fallbackScenarioGreeting(scenarioPreset, proficiencyLevel);
    }

    const vocabList = targetVocabulary?.map((v) => `${v.lemma} (${v.meaning})`).join(', ') || 'none';
    const isBeginner = proficiencyLevel === 'a1_a2';

    const levelGuideline = isBeginner
      ? `LEVEL REQUIREMENT (CRITICAL - CEFR A1-A2 Beginner):
- Use very simple, everyday English words.
- Keep the greeting under 15 words total.
- Ask ONLY ONE very simple, direct question (e.g. "What would you like to drink?").
- Do NOT use complex grammar (no present perfect continuous, no idioms, no double questions).`
      : `LEVEL REQUIREMENT (CEFR B1-C1 Intermediate/Advanced):
- Use natural, authentic conversational English with common phrasal verbs.
- Ask an engaging open-ended question.`;

    const prompt = `
You are roleplaying a friendly native speaker in a practical everyday English scenario.
Scenario preset: ${scenarioPreset}
Topic / Setting: ${topic || scenarioPreset}
Target vocabulary to naturally prompt: ${vocabList}
Learner level: ${proficiencyLevel}

${levelGuideline}

Instructions:
1. "greeting": Friendly, natural opening greeting (1-2 sentences) in English matching the level constraint.
2. "vietnameseTranslation": Accurate, natural Vietnamese translation of the greeting.
3. "quickReplies": 2-3 short, easy sample sentence responses in English that the learner can say in response.

Respond ONLY with valid JSON:
{
  "greeting": "...",
  "vietnameseTranslation": "...",
  "quickReplies": ["...", "..."]
}
`.trim();

    try {
      const response = await client.models.generateContent({
        model: this.primaryModel,
        contents: prompt,
        config: {
          temperature: 0.6,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      if (parsed.greeting) {
        return {
          greeting: parsed.greeting,
          vietnameseTranslation: parsed.vietnameseTranslation || '',
          quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies.map(String) : [],
        };
      }
      return this.fallbackScenarioGreeting(scenarioPreset, proficiencyLevel);
    } catch (err) {
      this.logger.warn(`Gemini generateScenarioGreeting failed, using fallback: ${err}`);
      return this.fallbackScenarioGreeting(scenarioPreset, proficiencyLevel);
    }
  }

  private fallbackScenarioGreeting(scenarioPreset: string, level: string = 'a1_a2'): ScenarioGreetingResult {
    const isBeginner = level === 'a1_a2';

    switch (scenarioPreset) {
      case 'coffee_shop':
        return isBeginner
          ? {
              greeting: 'Hi! Welcome to the coffee shop. What drink would you like today?',
              vietnameseTranslation: 'Chào bạn! Chào mừng đến quán cà phê. Bạn muốn dùng đồ uống gì hôm nay?',
              quickReplies: [
                'I would like an iced latte, please.',
                'Can I have a hot black coffee?',
                'Do you have decaf coffee?',
              ],
            }
          : {
              greeting: 'Hi there! Welcome to the cafe. What can I get started for you today?',
              vietnameseTranslation: 'Chào bạn! Chào mừng đến quán cà phê. Tôi có thể chuẩn bị món gì cho bạn hôm nay?',
              quickReplies: [
                'Could I get a large iced latte with oat milk?',
                'What single-origin coffees do you have on drip today?',
              ],
            };

      case 'hotel_travel':
        return isBeginner
          ? {
              greeting: 'Hello! Welcome to our hotel. Can I have your name and booking, please?',
              vietnameseTranslation: 'Xin chào! Chào mừng đến khách sạn của chúng tôi. Cho tôi xin tên và thông tin đặt phòng của bạn nhé?',
              quickReplies: [
                'Hi, I have a reservation under John.',
                'What time is breakfast tomorrow?',
                'Can you help me with my luggage?',
              ],
            }
          : {
              greeting: 'Good afternoon! Welcome to the Grand View Hotel. How can I assist you with your stay today?',
              vietnameseTranslation: 'Chào buổi chiều! Chào mừng đến Khách sạn Grand View. Tôi có thể giúp gì cho kỳ nghỉ của bạn hôm nay?',
              quickReplies: [
                'Hi, checking in for a two-night reservation under David.',
                'Could you tell me about the complimentary amenities and shuttle schedule?',
              ],
            };

      case 'job_interview':
        return isBeginner
          ? {
              greeting: 'Hello! Welcome. Thank you for coming today. How are you feeling?',
              vietnameseTranslation: 'Xin chào! Chào mừng bạn. Cảm ơn bạn đã đến hôm nay. Bạn cảm thấy thế nào?',
              quickReplies: [
                "I'm feeling good, thank you!",
                'A little nervous, but excited to be here.',
                'Thank you for having me today.',
              ],
            }
          : {
              greeting: 'Hello and welcome! Thank you for meeting with me today. Could you tell me a little bit about yourself and your background?',
              vietnameseTranslation: 'Xin chào và hoan nghênh bạn! Cảm ơn bạn đã tham gia buổi phỏng vấn hôm nay. Bạn có thể chia sẻ đôi nét về bản thân và kinh nghiệm của mình không?',
              quickReplies: [
                "Certainly! I've spent the past few years working in web development.",
                'Thank you. I have experience collaborating on agile cross-functional projects.',
              ],
            };

      case 'casual_chat':
      default:
        return isBeginner
          ? {
              greeting: 'Hi! So happy to see you. How are you doing today?',
              vietnameseTranslation: 'Chào bạn! Rất vui được gặp bạn. Hôm nay bạn thế nào?',
              quickReplies: [
                "I'm doing well, how about you?",
                'I had a busy day, but I am good.',
                'Not bad! Just relaxing at home.',
              ],
            }
          : {
              greeting: "Hey! It's so good to catch up with you. How has your day been going so far?",
              vietnameseTranslation: 'Chào bạn! Thật vui được trò chuyện với bạn. Ngày hôm nay của bạn thế nào rồi?',
              quickReplies: [
                'Pretty good, thanks! Just wrapped up a hectic work week.',
                'Not too bad! Excited to unwind this weekend.',
              ],
            };
    }
  }

  async scenarioTurn(params: {
    scenarioPreset: string;
    topic: string;
    targetVocabulary: ScenarioTargetWord[];
    usedVocabulary: string[];
    history: { role: 'user' | 'assistant'; text: string }[];
    userTranscript: string;
    proficiencyLevel?: string;
  }): Promise<ScenarioTurnResult> {
    const { scenarioPreset, topic, targetVocabulary, usedVocabulary, history, userTranscript, proficiencyLevel = 'a1_a2' } = params;
    const client = this.client || this.initClient();
    if (!client) {
      return this.fallbackScenarioTurn(targetVocabulary, usedVocabulary, userTranscript, proficiencyLevel);
    }

    const isBeginner = proficiencyLevel === 'a1_a2';
    const remainingVocab = targetVocabulary
      .filter((v) => !usedVocabulary.map((u) => u.toLowerCase()).includes(v.lemma.toLowerCase()))
      .map((v) => `${v.lemma} (${v.meaning})`)
      .join(', ');

    const recentHistory = history
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'Learner' : 'Assistant'}: ${h.text}`)
      .join('\n');

    const levelGuideline = isBeginner
      ? `LEARNER PROFICIENCY (CEFR A1-A2 Beginner):
- Keep your reply simple, encouraging, and under 15 words.
- Ask ONLY ONE straightforward, direct question. Never ask multiple questions.
- Use basic vocabulary and simple present / past tenses.
- Provide "quickReplies": 2-3 short, easy suggested answers (under 8 words each) the beginner can use next.`
      : `LEARNER PROFICIENCY (CEFR B1-C1 Intermediate/Advanced):
- Converse naturally in 1-3 sentences with authentic phrasing.
- If appropriate, subtly prompt one of the remaining target words.
- Provide "quickReplies": 2 suggested natural responses.`;

    const prompt = `
You are a supportive native English conversation partner in an everyday scenario.
Scenario: ${scenarioPreset} - ${topic}
Learner level: ${proficiencyLevel}
Target vocabulary the learner is practicing: ${targetVocabulary.map((v) => v.lemma).join(', ')}
Remaining target words to naturally elicit: ${remainingVocab || 'all practiced'}

${levelGuideline}

Recent dialogue:
${recentHistory}
Learner just said: "${userTranscript}"

Instructions:
1. "assistantText": Respond naturally and concisely in English matching the level constraint.
2. "vietnameseTranslation": Natural Vietnamese translation of your response.
3. "detectedTargetWords": Inspect the learner's utterance ("${userTranscript}") and check if they used any of the target words (matching lemmas or inflected forms like scale, scaled, scaling). Return an array of lemmas (e.g. ["scale"]).
4. "phrasingFeedback": If the learner's phrasing had unnatural wording or errors, provide 1 short, warm, constructive recommendation starting with "A native speaker might say: ...". If their sentence was fine, set this to null.
5. "quickReplies": 2-3 short, easy sample sentence responses in English the learner can say next.

Respond ONLY with valid JSON:
{
  "assistantText": "...",
  "vietnameseTranslation": "...",
  "detectedTargetWords": [],
  "phrasingFeedback": null,
  "quickReplies": ["...", "..."]
}
`.trim();

    try {
      const response = await client.models.generateContent({
        model: this.primaryModel,
        contents: prompt,
        config: {
          temperature: 0.6,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      // Local lemma check safeguard
      const localDetected = targetVocabulary
        .filter((tv) => {
          const regex = new RegExp(`\\b${tv.lemma}\\b`, 'i');
          return regex.test(userTranscript);
        })
        .map((tv) => tv.lemma.toLowerCase());

      const combinedDetected = Array.from(
        new Set([...(Array.isArray(parsed.detectedTargetWords) ? parsed.detectedTargetWords.map(String) : []), ...localDetected]),
      );

      return {
        assistantText: parsed.assistantText || "That's great! Tell me a bit more.",
        vietnameseTranslation: parsed.vietnameseTranslation || '',
        detectedTargetWords: combinedDetected,
        phrasingFeedback: parsed.phrasingFeedback || null,
        quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies.map(String) : [],
      };
    } catch (err) {
      this.logger.warn(`Gemini scenarioTurn failed, using fallback: ${err}`);
      return this.fallbackScenarioTurn(targetVocabulary, usedVocabulary, userTranscript, proficiencyLevel);
    }
  }

  private fallbackScenarioTurn(
    targetVocabulary: ScenarioTargetWord[],
    usedVocabulary: string[],
    userTranscript: string,
    level: string = 'a1_a2',
  ): ScenarioTurnResult {
    const detected: string[] = [];
    for (const item of targetVocabulary) {
      const regex = new RegExp(`\\b${item.lemma}\\b`, 'i');
      if (regex.test(userTranscript)) {
        detected.push(item.lemma.toLowerCase());
      }
    }

    const isBeginner = level === 'a1_a2';
    return isBeginner
      ? {
          assistantText: 'That sounds nice! Do you like to do that often?',
          vietnameseTranslation: 'Nghe hay đấy! Bạn có thường thích làm việc đó không?',
          detectedTargetWords: detected,
          phrasingFeedback: null,
          quickReplies: ['Yes, I do it every week.', 'No, only sometimes.', 'Not very often.'],
        }
      : {
          assistantText: 'That makes total sense! Could you tell me a bit more about what you have in mind?',
          vietnameseTranslation: 'Điều đó hoàn toàn hợp lý! Bạn có thể chia sẻ thêm về dự định của mình không?',
          detectedTargetWords: detected,
          phrasingFeedback: null,
          quickReplies: ['Sure, I was thinking about...', 'Actually, let me explain.'],
        };
  }

  async evaluateScenarioSession(params: {
    scenarioPreset: string;
    topic: string;
    dialogueHistory: { role: 'user' | 'assistant'; text: string }[];
    targetVocabulary: ScenarioTargetWord[];
    usedVocabulary: string[];
    durationSeconds: number;
  }): Promise<ScenarioSessionSummaryResult> {
    const { scenarioPreset, topic, dialogueHistory, targetVocabulary, usedVocabulary, durationSeconds } = params;
    const client = this.client || this.initClient();

    const userTurns = dialogueHistory.filter((d) => d.role === 'user');
    const totalWords = userTurns.reduce((acc, t) => acc + t.text.split(/\s+/).filter(Boolean).length, 0);
    const minutes = Math.max(0.5, durationSeconds / 60);
    const calculatedWpm = Math.round(totalWords / minutes);

    if (!client) {
      return this.fallbackScenarioSummary(totalWords, calculatedWpm, targetVocabulary.length, usedVocabulary.length);
    }

    const dialogueText = dialogueHistory
      .map((d) => `${d.role === 'user' ? 'Learner' : 'Assistant'}: ${d.text}`)
      .join('\n');

    const prompt = `
Analyze this completed English scenario conversation session.
Scenario: ${scenarioPreset} - ${topic}
Session duration: ${durationSeconds} seconds
Learner words spoken: ~${totalWords}
Target vocabulary practiced: ${targetVocabulary.map((v) => v.lemma).join(', ')}
Target vocabulary successfully used: ${usedVocabulary.join(', ')}

Full dialogue:
${dialogueText}

Instructions:
1. "dialogueSummary": 1-2 sentences warmly summarizing how the conversation went and praising learner engagement.
2. "naturalPhrasingTips": 2-3 specific, constructive suggestions highlighting phrases the learner used and how a native speaker would phrase them more naturally (e.g., "Instead of '...', you can say '...'").
3. "conversationFluencyScore": An integer score from 65 to 98 evaluating communication flow, clarity, and willingness to converse.
4. "fillerWordsCount": Approximate count of filler words ("um", "uh", "like", "you know") used by the learner.

Respond ONLY with valid JSON:
{
  "dialogueSummary": "...",
  "naturalPhrasingTips": [
    "..."
  ],
  "conversationFluencyScore": 85,
  "fillerWordsCount": 2
}
`.trim();

    try {
      const response = await client.models.generateContent({
        model: this.primaryModel,
        contents: prompt,
        config: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      return {
        dialogueSummary: parsed.dialogueSummary || 'Great practical conversational interaction! You communicated your ideas clearly and kept the dialogue moving.',
        naturalPhrasingTips: Array.isArray(parsed.naturalPhrasingTips) && parsed.naturalPhrasingTips.length > 0
          ? parsed.naturalPhrasingTips.map(String)
          : ['Keep practicing connected speech when answering open-ended questions.'],
        conversationFluencyScore: typeof parsed.conversationFluencyScore === 'number' ? parsed.conversationFluencyScore : 85,
        speakingPaceWpm: calculatedWpm,
        fillerWordsCount: typeof parsed.fillerWordsCount === 'number' ? parsed.fillerWordsCount : 2,
      };
    } catch (err) {
      this.logger.warn(`Gemini evaluateScenarioSession failed, using fallback: ${err}`);
      return this.fallbackScenarioSummary(totalWords, calculatedWpm, targetVocabulary.length, usedVocabulary.length);
    }
  }

  private fallbackScenarioSummary(
    totalWords: number,
    wpm: number,
    targetCount: number,
    usedCount: number,
  ): ScenarioSessionSummaryResult {
    return {
      dialogueSummary: 'Great casual conversational practice! You successfully maintained a natural dialogue and expressed your thoughts effectively.',
      naturalPhrasingTips: [
        "In everyday situations, try using conversational transitions like 'By the way' or 'Actually'.",
        'Feel free to ask follow-up questions to keep the interaction dynamic.',
      ],
      conversationFluencyScore: Math.min(95, Math.max(70, 75 + Math.round((usedCount / (targetCount || 1)) * 20))),
      speakingPaceWpm: wpm || 110,
      fillerWordsCount: 1,
    };
  }
}


