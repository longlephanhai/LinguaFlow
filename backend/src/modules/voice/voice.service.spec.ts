import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { VoiceService } from './voice.service.js';

describe('VoiceService', () => {
  let service: VoiceService;
  let mockVoiceSessionModel: any;
  let mockVocabularyItemModel: any;
  let mockReviewService: any;
  let mockAiService: any;

  const userId = new Types.ObjectId().toString();
  const sessionId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockVoiceSessionModel = {
      create: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      countDocuments: vi.fn(),
    };

    mockVocabularyItemModel = {
      find: vi.fn(),
    };

    mockReviewService = {
      getDueOccurrences: vi.fn(),
    };

    mockAiService = {
      generateScenarioGreeting: vi.fn(),
      scenarioTurn: vi.fn(),
      evaluateScenarioSession: vi.fn(),
    };

    service = new VoiceService(
      mockVoiceSessionModel as any,
      mockVocabularyItemModel as any,
      mockReviewService as any,
      mockAiService as any,
    );
  });

  describe('startSession', () => {
    it('initializes a scenario conversation with due SRS words and initial greeting', async () => {
      mockReviewService.getDueOccurrences.mockResolvedValue({
        occurrences: [
          { occurrenceId: 'occ_1', lemma: 'scale', meaning: 'expand in size' },
          { occurrenceId: 'occ_2', lemma: 'ubiquitous', meaning: 'present everywhere' },
        ],
      });

      mockAiService.generateScenarioGreeting.mockResolvedValue({
        greeting: 'Hi there! Welcome to the cafe. What can I get started for you today?',
        vietnameseTranslation: 'Chào bạn! Chào mừng đến quán cà phê.',
        quickReplies: ['I would like an iced latte, please.'],
      });

      const fakeSession = {
        _id: new Types.ObjectId(sessionId),
        scenarioPreset: 'coffee_shop',
        topic: 'Coffee Shop & Cafe Orders',
        targetVocabulary: [
          { id: 'occ_1', lemma: 'scale', meaning: 'expand in size' },
          { id: 'occ_2', lemma: 'ubiquitous', meaning: 'present everywhere' },
        ],
      };
      mockVoiceSessionModel.create.mockResolvedValue(fakeSession);

      const result = await service.startSession(userId, {
        scenarioPreset: 'coffee_shop',
        targetWordsCount: 2,
      });

      expect(mockReviewService.getDueOccurrences).toHaveBeenCalledWith(userId);
      expect(mockAiService.generateScenarioGreeting).toHaveBeenCalled();
      expect(mockVoiceSessionModel.create).toHaveBeenCalled();
      expect(result.sessionId).toBe(sessionId);
      expect(result.scenario).toBe('Coffee Shop & Cafe Orders');
      expect(result.initialGreeting).toContain('Welcome to the cafe');
    });

    it('supplements with default scenario words if user bank has zero vocabulary', async () => {
      mockReviewService.getDueOccurrences.mockResolvedValue({ occurrences: [] });
      mockVocabularyItemModel.find.mockReturnValue({
        limit: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([]),
        }),
      });

      mockAiService.generateScenarioGreeting.mockResolvedValue({
        greeting: 'Welcome! What can I get for you?',
        vietnameseTranslation: 'Chào bạn! Tôi có thể lấy gì cho bạn?',
        quickReplies: [],
      });
      mockVoiceSessionModel.create.mockImplementation((data) => ({
        _id: new Types.ObjectId(sessionId),
        ...data,
      }));

      const result = await service.startSession(userId, {
        scenarioPreset: 'coffee_shop',
        targetWordsCount: 3,
      });

      expect(result.targetVocabulary.length).toBeGreaterThan(0);
      expect(result.targetVocabulary[0].lemma).toBe('decaf');
    });
  });

  describe('handleTurn', () => {
    it('processes user turn, updates dialogue history, and tracks detected target words', async () => {
      const mockSession: any = {
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        scenarioPreset: 'coffee_shop',
        topic: 'Coffee Shop & Cafe Orders',
        targetVocabulary: [
          { id: '1', lemma: 'scale', meaning: 'expand in size' },
          { id: '2', lemma: 'decaf', meaning: 'caffeine-free' },
        ],
        dialogueHistory: [
          { role: 'assistant', text: 'Hi! What can I get for you?', detectedTargetWords: [] },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      mockVoiceSessionModel.findOne.mockResolvedValue(mockSession);
      mockAiService.scenarioTurn.mockResolvedValue({
        assistantText: 'Sure thing, an iced decaf latte coming right up! Anything else?',
        detectedTargetWords: ['decaf'],
        phrasingFeedback: null,
      });

      const result = await service.handleTurn(userId, {
        sessionId,
        userTranscript: 'Can I get a large decaf latte please?',
      });

      expect(mockAiService.scenarioTurn).toHaveBeenCalled();
      expect(mockSession.dialogueHistory).toHaveLength(3); // Initial assistant + user + new assistant
      expect(mockSession.dialogueHistory[1].role).toBe('user');
      expect(mockSession.dialogueHistory[1].detectedTargetWords).toEqual(['decaf']);
      expect(mockSession.save).toHaveBeenCalled();
      expect(result.assistantText).toContain('iced decaf latte');
      expect(result.detectedTargetWords).toEqual(['decaf']);
      expect(result.targetWordsRemaining).toEqual(['scale']);
    });

    it('throws NotFoundException if session does not exist', async () => {
      mockVoiceSessionModel.findOne.mockResolvedValue(null);

      await expect(
        service.handleTurn(userId, {
          sessionId,
          userTranscript: 'Hello there',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('endSession', () => {
    it('finalizes conversation, calculates duration, spoken metrics, and returns summary', async () => {
      const mockSession: any = {
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        createdAt: new Date(Date.now() - 60000), // 60s ago
        scenarioPreset: 'coffee_shop',
        topic: 'Coffee Shop & Cafe Orders',
        targetVocabulary: [
          { id: '1', lemma: 'scale', meaning: 'expand in size' },
          { id: '2', lemma: 'decaf', meaning: 'caffeine-free' },
        ],
        dialogueHistory: [
          { role: 'assistant', text: 'Hi! What can I get for you?' },
          { role: 'user', text: 'Can I get a decaf coffee?', detectedTargetWords: ['decaf'] },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      mockVoiceSessionModel.findOne.mockResolvedValue(mockSession);
      mockAiService.evaluateScenarioSession.mockResolvedValue({
        dialogueSummary: 'Great casual cafe interaction.',
        naturalPhrasingTips: ["Instead of 'make it large', you can say 'can I get a large'."],
        conversationFluencyScore: 88,
        fillerWordsCount: 1,
        speakingPaceWpm: 120,
      });

      const result = await service.endSession(userId, { sessionId });

      expect(mockAiService.evaluateScenarioSession).toHaveBeenCalled();
      expect(mockSession.status).toBe('completed');
      expect(mockSession.save).toHaveBeenCalled();
      expect(result.sessionId).toBe(sessionId);
      expect(result.spokenMetrics.conversationFluencyScore).toBe(88);
      expect(result.spokenMetrics.activationRate).toBe(50); // 1 out of 2 used
      expect(result.vocabularyMastered).toEqual(['decaf']);
      expect(result.naturalPhrasingTips).toHaveLength(1);
    });
  });

  describe('getSessions & getSessionById & deleteSession', () => {
    it('returns paginated past sessions', async () => {
      const mockList = [
        {
          _id: new Types.ObjectId(sessionId),
          scenarioPreset: 'coffee_shop',
          topic: 'Coffee Shop & Cafe Orders',
          durationSeconds: 120,
          status: 'completed',
          spokenMetrics: { activationRate: 80, conversationFluencyScore: 85 },
          dialogueSummary: 'Good practice',
          dialogueHistory: [{}, {}],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockVoiceSessionModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              exec: vi.fn().mockResolvedValue(mockList),
            }),
          }),
        }),
      });
      mockVoiceSessionModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      });

      const result = await service.getSessions(userId, { page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].turnsCount).toBe(2);
    });

    it('soft deletes session successfully', async () => {
      mockVoiceSessionModel.findOneAndUpdate.mockResolvedValue({ _id: sessionId, isDeleted: true });
      const result = await service.deleteSession(sessionId, userId);
      expect(result.success).toBe(true);
    });
  });
});

