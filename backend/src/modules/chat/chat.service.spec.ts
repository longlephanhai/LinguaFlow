import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ChatService } from './chat.service.js';

describe('ChatService', () => {
  let service: ChatService;
  let mockChatSessionModel: any;
  let mockAiService: any;
  let mockVocabularyService: any;

  const userId = new Types.ObjectId().toString();
  const sessionId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockChatSessionModel = function (data: any) {
      return {
        _id: new Types.ObjectId(),
        ...data,
        messages: data.messages || [],
        save: vi.fn().mockResolvedValue(true),
      };
    };

    mockChatSessionModel.findOne = vi.fn();
    mockChatSessionModel.findOneAndUpdate = vi.fn();
    mockChatSessionModel.find = vi.fn();
    mockChatSessionModel.countDocuments = vi.fn();

    mockAiService = {
      chat: vi.fn(),
    };

    mockVocabularyService = {
      getRecentLemmas: vi.fn().mockResolvedValue(['scale', 'resilient', 'ubiquitous']),
    };

    service = new ChatService(
      mockChatSessionModel as any,
      mockAiService,
      mockVocabularyService,
    );
  });

  describe('sendMessage', () => {
    it('should throw BadRequestException if message is empty', async () => {
      await expect(
        service.sendMessage(userId, { message: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a new session if no sessionId is provided (AC-1)', async () => {
      mockAiService.chat.mockResolvedValue('Hello! How can I help you practice English today?');

      const result = await service.sendMessage(userId, {
        message: 'Hello, can you help me practice?',
      });

      expect(result).toHaveProperty('sessionId');
      expect(result.reply).toBe('Hello! How can I help you practice English today?');
      expect(mockAiService.chat).toHaveBeenCalledWith(
        [],
        'Hello, can you help me practice?',
        ['scale', 'resilient', 'ubiquitous'],
      );
    });

    it('should continue an existing session if sessionId is provided (AC-2)', async () => {
      const existingSession = {
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        title: 'Initial discussion',
        messages: [
          { role: 'user', content: 'Hi', createdAt: new Date() },
          { role: 'assistant', content: 'Hello there!', createdAt: new Date() },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      mockChatSessionModel.findOne.mockResolvedValue(existingSession);
      mockAiService.chat.mockResolvedValue('The word "scale" means to climb or to expand.');

      const result = await service.sendMessage(userId, {
        sessionId,
        message: 'How do I use "scale"?',
      });

      expect(result.sessionId).toBe(sessionId);
      expect(result.reply).toBe('The word "scale" means to climb or to expand.');
      expect(existingSession.messages).toHaveLength(4);
      expect(existingSession.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if sessionId is invalid or not found', async () => {
      mockChatSessionModel.findOne.mockResolvedValue(null);

      await expect(
        service.sendMessage(userId, {
          sessionId,
          message: 'Hello',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if session has 200 messages cap', async () => {
      const fullMessages = Array.from({ length: 200 }, () => ({
        role: 'user',
        content: 'ping',
        createdAt: new Date(),
      }));

      mockChatSessionModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        messages: fullMessages,
      });

      await expect(
        service.sendMessage(userId, {
          sessionId,
          message: 'One more message',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSessions', () => {
    it('should return paginated sessions with messageCount', async () => {
      mockChatSessionModel.countDocuments.mockResolvedValue(1);
      mockChatSessionModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([
                  {
                    _id: new Types.ObjectId(sessionId),
                    title: 'Practice scale',
                    messages: [{ role: 'user' }, { role: 'assistant' }],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ]),
              }),
            }),
          }),
        }),
      });

      const res = await service.getSessions(userId, { page: 1, limit: 10 });
      expect(res.total).toBe(1);
      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe(sessionId);
      expect(res.items[0].messageCount).toBe(2);
      expect(res.items[0].title).toBe('Practice scale');
    });
  });

  describe('getSession', () => {
    it('should return full session by id', async () => {
      mockChatSessionModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(sessionId),
        title: 'Session title',
        messages: [{ role: 'user', content: 'test', createdAt: new Date() }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.getSession(userId, sessionId);
      expect(res.id).toBe(sessionId);
      expect(res.title).toBe('Session title');
      expect(res.messages).toHaveLength(1);
    });

    it('should throw NotFoundException if session not found', async () => {
      mockChatSessionModel.findOne.mockResolvedValue(null);
      await expect(service.getSession(userId, sessionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSession', () => {
    it('should soft-delete session', async () => {
      mockChatSessionModel.findOneAndUpdate.mockResolvedValue({
        _id: new Types.ObjectId(sessionId),
        isDeleted: true,
      });

      const res = await service.deleteSession(userId, sessionId);
      expect(res.success).toBe(true);
      expect(mockChatSessionModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: new Types.ObjectId(sessionId),
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        },
        expect.objectContaining({
          $set: expect.objectContaining({ isDeleted: true }),
        }),
        { new: true },
      );
    });

    it('should throw NotFoundException if session not found for deletion', async () => {
      mockChatSessionModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(service.deleteSession(userId, sessionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSuggestedWords', () => {
    it('should return up to 5 suggested words from user vocabulary', async () => {
      mockVocabularyService.getRecentLemmas.mockResolvedValue([
        'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig',
      ]);

      const res = await service.getSuggestedWords(userId);
      expect(res.words.length).toBeLessThanOrEqual(5);
      expect(res.words.length).toBeGreaterThan(0);
    });

    it('should return empty array if user has no vocabulary', async () => {
      mockVocabularyService.getRecentLemmas.mockResolvedValue([]);
      const res = await service.getSuggestedWords(userId);
      expect(res.words).toEqual([]);
    });
  });
});
