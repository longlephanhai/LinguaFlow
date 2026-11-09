import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VoiceSession, VoiceSessionDocument } from './schemas/voice-session.schema.js';
import { StartVoiceSessionDto } from './dto/start-voice-session.dto.js';
import { VoiceTurnDto } from './dto/voice-turn.dto.js';
import { EndVoiceSessionDto } from './dto/end-voice-session.dto.js';
import { QueryVoiceSessionsDto } from './dto/query-voice-sessions.dto.js';
import { ReviewService } from '../review/review.service.js';
import { AiService } from '../ai/ai.service.js';
import { VocabularyItem } from '../vocabulary/schemas/vocabulary-item.schema.js';

const PRESET_TOPIC_MAP: Record<string, string> = {
  coffee_shop: 'Coffee Shop & Cafe Orders',
  hotel_travel: 'Hotel Check-in & Travel Inquiries',
  casual_chat: 'Casual Catch-up with a Friend',
  job_interview: 'Casual Conversational Job Interview',
};

const DEFAULT_SCENARIO_WORDS: Record<string, { lemma: string; meaning: string }[]> = {
  coffee_shop: [
    { lemma: 'decaf', meaning: 'coffee with caffeine removed' },
    { lemma: 'pastry', meaning: 'baked sweet food like a croissant or tart' },
    { lemma: 'receipt', meaning: 'written proof of purchase' },
    { lemma: 'customize', meaning: 'modify to suit individual preference' },
    { lemma: 'recommendation', meaning: 'suggestion for a suitable item' },
  ],
  hotel_travel: [
    { lemma: 'reservation', meaning: 'an arrangement to have a room held in advance' },
    { lemma: 'amenities', meaning: 'desirable or useful features like pool or gym' },
    { lemma: 'itinerary', meaning: 'a planned route or schedule of travel' },
    { lemma: 'shuttle', meaning: 'transport that travels regularly between two points' },
    { lemma: 'luggage', meaning: 'suitcases or bags containing personal belongings' },
  ],
  casual_chat: [
    { lemma: 'catch up', meaning: 'talk to find out what someone has been doing' },
    { lemma: 'hectic', meaning: 'full of busy, frantic activity' },
    { lemma: 'unwind', meaning: 'relax after a period of work or tension' },
    { lemma: 'spontaneous', meaning: 'performed or occurring without premeditation' },
    { lemma: 'worthwhile', meaning: 'worth the time, money, or effort spent' },
  ],
  job_interview: [
    { lemma: 'collaborate', meaning: 'work jointly on an activity or project' },
    { lemma: 'initiative', meaning: 'the ability to act or take charge before others do' },
    { lemma: 'adaptable', meaning: 'able to adjust to new conditions' },
    { lemma: 'milestone', meaning: 'a significant stage or event in the development of something' },
    { lemma: 'prioritize', meaning: 'designate or treat as more important' },
  ],
};

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    @InjectModel(VoiceSession.name)
    private readonly voiceSessionModel: Model<VoiceSessionDocument>,
    @InjectModel(VocabularyItem.name)
    private readonly vocabularyItemModel: Model<VocabularyItem>,
    private readonly reviewService: ReviewService,
    private readonly aiService: AiService,
  ) {}

  async startSession(userId: string, dto: StartVoiceSessionDto) {
    const userObjId = new Types.ObjectId(userId);
    const scenarioPreset = dto.scenarioPreset || 'casual_chat';
    const topic = dto.topic || PRESET_TOPIC_MAP[scenarioPreset] || 'Everyday Conversation';
    const targetCount = dto.targetWordsCount || 5;
    const proficiencyLevel = dto.proficiencyLevel || 'a1_a2';

    // 1. Fetch due items from SRS
    const dueResult = await this.reviewService.getDueOccurrences(userId);
    const dueItems = dueResult?.occurrences || [];
    const targetVocabulary: { id: string; lemma: string; meaning: string; vocabularyItemId?: Types.ObjectId }[] = [];
    const seenLemmas = new Set<string>();

    for (const item of dueItems) {
      const lower = item.lemma.toLowerCase().trim();
      if (!seenLemmas.has(lower)) {
        seenLemmas.add(lower);
        targetVocabulary.push({
          id: item.occurrenceId,
          lemma: item.lemma,
          meaning: item.meaning,
        });
      }
      if (targetVocabulary.length >= targetCount) break;
    }

    // 2. If fewer than requested, supplement with user's other vocabulary items
    if (targetVocabulary.length < targetCount) {
      const userVocabs = await this.vocabularyItemModel
        .find({ userId: userObjId, isDeleted: false })
        .limit(targetCount * 2)
        .exec();

      for (const vocab of userVocabs) {
        const lower = vocab.lemma.toLowerCase().trim();
        if (!seenLemmas.has(lower)) {
          seenLemmas.add(lower);
          targetVocabulary.push({
            id: vocab._id.toString(),
            lemma: vocab.lemma,
            meaning: `Contextual meaning of "${vocab.lemma}"`,
            vocabularyItemId: vocab._id,
          });
        }
        if (targetVocabulary.length >= targetCount) break;
      }
    }

    // 3. Fallback to situational defaults if user's bank has insufficient items
    if (targetVocabulary.length < targetCount) {
      const fallbackList = DEFAULT_SCENARIO_WORDS[scenarioPreset] || DEFAULT_SCENARIO_WORDS.casual_chat;
      for (const fallback of fallbackList) {
        const lower = fallback.lemma.toLowerCase().trim();
        if (!seenLemmas.has(lower)) {
          seenLemmas.add(lower);
          targetVocabulary.push({
            id: `seed_${lower}`,
            lemma: fallback.lemma,
            meaning: fallback.meaning,
          });
        }
        if (targetVocabulary.length >= targetCount) break;
      }
    }

    // 4. Generate scenario greeting via AI
    const greetingResult = await this.aiService.generateScenarioGreeting(
      scenarioPreset,
      topic,
      targetVocabulary.map((t) => ({ id: t.id, lemma: t.lemma, meaning: t.meaning })),
      proficiencyLevel,
    );

    // 5. Create voice session record
    const targetVocabularyItemIds = targetVocabulary
      .map((t) => t.vocabularyItemId)
      .filter((id): id is Types.ObjectId => Boolean(id));

    const session = await this.voiceSessionModel.create({
      userId: userObjId,
      scenarioPreset,
      topic,
      proficiencyLevel,
      durationSeconds: 0,
      targetVocabularyItemIds,
      usedVocabularyItemIds: [],
      targetVocabulary: targetVocabulary.map((t) => ({
        id: t.id,
        lemma: t.lemma,
        meaning: t.meaning,
      })),
      dialogueHistory: [
        {
          role: 'assistant',
          text: greetingResult.greeting,
          timestamp: new Date(),
          detectedTargetWords: [],
          phrasingFeedback: null,
          vietnameseTranslation: greetingResult.vietnameseTranslation || null,
          quickReplies: greetingResult.quickReplies || [],
        },
      ],
      spokenMetrics: {
        totalWordsSpoken: 0,
        speakingPaceWpm: 0,
        fillerWordsCount: 0,
        activationRate: 0,
        conversationFluencyScore: 0,
      },
      dialogueSummary: null,
      naturalPhrasingTips: [],
      status: 'active',
      isDeleted: false,
    });

    return {
      sessionId: session._id.toString(),
      scenario: topic,
      targetVocabulary: session.targetVocabulary,
      initialGreeting: greetingResult.greeting,
      initialGreetingTranslation: greetingResult.vietnameseTranslation,
      quickReplies: greetingResult.quickReplies || [],
    };
  }

  async handleTurn(userId: string, dto: VoiceTurnDto) {
    const userObjId = new Types.ObjectId(userId);
    const session = await this.voiceSessionModel.findOne({
      _id: new Types.ObjectId(dto.sessionId),
      userId: userObjId,
      isDeleted: false,
    });

    if (!session) {
      throw new NotFoundException('Voice conversation session not found.');
    }

    // Call AI scenario turn
    const turnResult = await this.aiService.scenarioTurn({
      scenarioPreset: session.scenarioPreset,
      topic: session.topic,
      targetVocabulary: session.targetVocabulary.map((t) => ({
        id: t.id,
        lemma: t.lemma,
        meaning: t.meaning,
      })),
      usedVocabulary: session.dialogueHistory.flatMap((d) => d.detectedTargetWords),
      history: session.dialogueHistory.map((d) => ({
        role: d.role,
        text: d.text,
      })),
      userTranscript: dto.userTranscript,
      proficiencyLevel: session.proficiencyLevel || 'a1_a2',
    });

    // Record user turn
    session.dialogueHistory.push({
      role: 'user',
      text: dto.userTranscript,
      timestamp: new Date(),
      detectedTargetWords: turnResult.detectedTargetWords,
      phrasingFeedback: turnResult.phrasingFeedback,
    });

    // Record assistant turn
    session.dialogueHistory.push({
      role: 'assistant',
      text: turnResult.assistantText,
      timestamp: new Date(),
      detectedTargetWords: [],
      phrasingFeedback: null,
      vietnameseTranslation: turnResult.vietnameseTranslation || null,
      quickReplies: turnResult.quickReplies || [],
    });

    // Calculate remaining target words
    const allUsed = new Set<string>();
    for (const turn of session.dialogueHistory) {
      for (const w of turn.detectedTargetWords || []) {
        allUsed.add(w.toLowerCase());
      }
    }

    const targetWordsRemaining = session.targetVocabulary
      .filter((t) => !allUsed.has(t.lemma.toLowerCase()))
      .map((t) => t.lemma);

    await session.save();

    return {
      assistantText: turnResult.assistantText,
      vietnameseTranslation: turnResult.vietnameseTranslation,
      detectedTargetWords: turnResult.detectedTargetWords,
      phrasingFeedback: turnResult.phrasingFeedback,
      targetWordsRemaining,
      quickReplies: turnResult.quickReplies || [],
    };
  }

  async endSession(userId: string, dto: EndVoiceSessionDto) {
    const userObjId = new Types.ObjectId(userId);
    const session = await this.voiceSessionModel.findOne({
      _id: new Types.ObjectId(dto.sessionId),
      userId: userObjId,
      isDeleted: false,
    });

    if (!session) {
      throw new NotFoundException('Voice conversation session not found.');
    }

    // Calculate duration
    const createdAtTime = (session as any).createdAt ? new Date((session as any).createdAt).getTime() : Date.now();
    const durationSeconds = Math.max(15, Math.round((Date.now() - createdAtTime) / 1000));
    session.durationSeconds = durationSeconds;

    // Collect all unique used target words
    const allUsedLemmas = new Set<string>();
    let totalWordsSpoken = 0;

    for (const turn of session.dialogueHistory) {
      if (turn.role === 'user') {
        const words = turn.text.split(/\s+/).filter(Boolean);
        totalWordsSpoken += words.length;
        for (const word of turn.detectedTargetWords || []) {
          allUsedLemmas.add(word.toLowerCase());
        }
      }
    }

    const activationRate = session.targetVocabulary.length > 0
      ? Math.round((allUsedLemmas.size / session.targetVocabulary.length) * 100)
      : 100;

    // Evaluate summary with AI
    const evaluation = await this.aiService.evaluateScenarioSession({
      scenarioPreset: session.scenarioPreset,
      topic: session.topic,
      dialogueHistory: session.dialogueHistory.map((d) => ({
        role: d.role,
        text: d.text,
      })),
      targetVocabulary: session.targetVocabulary.map((t) => ({
        id: t.id,
        lemma: t.lemma,
        meaning: t.meaning,
      })),
      usedVocabulary: Array.from(allUsedLemmas),
      durationSeconds,
    });

    const minutes = Math.max(0.5, durationSeconds / 60);
    const speakingPaceWpm = evaluation.speakingPaceWpm || Math.round(totalWordsSpoken / minutes);

    session.spokenMetrics = {
      totalWordsSpoken,
      speakingPaceWpm,
      fillerWordsCount: evaluation.fillerWordsCount || 0,
      activationRate,
      conversationFluencyScore: evaluation.conversationFluencyScore,
    };
    session.dialogueSummary = evaluation.dialogueSummary;
    session.naturalPhrasingTips = evaluation.naturalPhrasingTips;
    session.status = 'completed';

    await session.save();

    return {
      sessionId: session._id.toString(),
      durationSeconds,
      spokenMetrics: session.spokenMetrics,
      dialogueSummary: session.dialogueSummary,
      naturalPhrasingTips: session.naturalPhrasingTips,
      vocabularyMastered: Array.from(allUsedLemmas),
    };
  }

  async getSessions(userId: string, query: QueryVoiceSessionsDto) {
    const userObjId = new Types.ObjectId(userId);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: userObjId, isDeleted: false };
    const [sessions, total] = await Promise.all([
      this.voiceSessionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.voiceSessionModel.countDocuments(filter).exec(),
    ]);

    const items = sessions.map((s) => ({
      id: s._id.toString(),
      scenarioPreset: s.scenarioPreset,
      topic: s.topic,
      durationSeconds: s.durationSeconds,
      status: s.status,
      spokenMetrics: s.spokenMetrics,
      dialogueSummary: s.dialogueSummary,
      turnsCount: s.dialogueHistory.length,
      createdAt: (s as any).createdAt,
      updatedAt: (s as any).updatedAt,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getSessionById(id: string, userId: string) {
    const session = await this.voiceSessionModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!session) {
      throw new NotFoundException('Voice session not found.');
    }

    return {
      id: session._id.toString(),
      scenarioPreset: session.scenarioPreset,
      topic: session.topic,
      durationSeconds: session.durationSeconds,
      targetVocabulary: session.targetVocabulary,
      dialogueHistory: session.dialogueHistory,
      spokenMetrics: session.spokenMetrics,
      dialogueSummary: session.dialogueSummary,
      naturalPhrasingTips: session.naturalPhrasingTips,
      status: session.status,
      createdAt: (session as any).createdAt,
      updatedAt: (session as any).updatedAt,
    };
  }

  async deleteSession(id: string, userId: string) {
    const session = await this.voiceSessionModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    );

    if (!session) {
      throw new NotFoundException('Voice session not found.');
    }

    return { success: true };
  }
}

