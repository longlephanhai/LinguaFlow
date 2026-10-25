import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { QuizService } from './quiz.service.js';

describe('QuizService', () => {
  let service: QuizService;
  let mockQuizModel: any;
  let mockQuizResultModel: any;
  let mockOccurrenceModel: any;
  let mockAiService: any;

  const userId = new Types.ObjectId().toString();
  const quizId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockQuizModel = {
      create: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
    };
    mockQuizResultModel = function (data: any) {
      return {
        ...data,
        save: vi.fn().mockResolvedValue(true),
      };
    };
    (mockQuizResultModel as any).findOne = vi.fn();
    (mockQuizResultModel as any).find = vi.fn();

    mockOccurrenceModel = {
      find: vi.fn(),
    };

    mockAiService = {
      generateQuiz: vi.fn(),
    };

    service = new QuizService(
      mockQuizModel,
      mockQuizResultModel as any,
      mockOccurrenceModel,
      mockAiService,
    );
  });

  describe('generate', () => {
    it('should throw BadRequestException if fewer than 4 saved words (EDGE-009)', async () => {
      mockOccurrenceModel.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              { _id: new Types.ObjectId(), selectedText: 'word1', sentence: 'sent1' },
              { _id: new Types.ObjectId(), selectedText: 'word2', sentence: 'sent2' },
            ]),
          }),
        }),
      });

      await expect(service.generate(userId, { scope: 'all', count: 10 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate quiz and return sanitized questions without correct answers', async () => {
      const occurrences = Array.from({ length: 4 }).map((_, i) => ({
        _id: new Types.ObjectId(),
        selectedText: `word${i}`,
        sentence: `sentence ${i}`,
        vocabularyItemId: { lemma: `lemma${i}` },
        meaningId: { definition: `def${i}` },
      }));

      mockOccurrenceModel.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(occurrences),
          }),
        }),
      });

      mockAiService.generateQuiz.mockResolvedValue([
        {
          occurrenceId: occurrences[0]._id.toString(),
          questionText: 'What does lemma0 mean?',
          options: ['A', 'B', 'C', 'D'],
          correctIndex: 1,
          explanation: 'B is right',
        },
      ]);

      mockQuizModel.create.mockResolvedValue({
        _id: new Types.ObjectId(quizId),
        questions: [
          {
            occurrenceId: occurrences[0]._id,
            questionText: 'What does lemma0 mean?',
            options: ['A', 'B', 'C', 'D'],
            correctIndex: 1,
            explanation: 'B is right',
          },
        ],
      });

      const result = await service.generate(userId, { scope: 'all', count: 10 });
      expect(result.quizId).toBe(quizId);
      expect(result.questions).toHaveLength(1);
      expect((result.questions[0] as any).correctIndex).toBeUndefined();
      expect((result.questions[0] as any).explanation).toBeUndefined();
      expect(result.questions[0].options).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  describe('answer', () => {
    it('should throw NotFoundException if quiz does not exist', async () => {
      mockQuizModel.findOne.mockResolvedValue(null);

      await expect(
        service.answer(userId, quizId, { questionIndex: 0, selectedIndex: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should evaluate answer and update score', async () => {
      const mockQuiz = {
        _id: new Types.ObjectId(quizId),
        userId: new Types.ObjectId(userId),
        questions: [
          {
            correctIndex: 2,
            explanation: 'C is correct.',
          },
        ],
        status: 'pending',
        save: vi.fn().mockResolvedValue(true),
      };

      mockQuizModel.findOne.mockResolvedValue(mockQuiz);
      (mockQuizResultModel as any).findOne.mockResolvedValue(null);

      const result = await service.answer(userId, quizId, {
        questionIndex: 0,
        selectedIndex: 2,
      });

      expect(result.correct).toBe(true);
      expect(result.correctIndex).toBe(2);
      expect(result.explanation).toBe('C is correct.');
      expect(mockQuiz.status).toBe('completed');
    });

    it('should be idempotent if question was already answered', async () => {
      const mockQuiz = {
        _id: new Types.ObjectId(quizId),
        userId: new Types.ObjectId(userId),
        questions: [
          {
            correctIndex: 1,
            explanation: 'B is correct.',
          },
        ],
        status: 'pending',
        save: vi.fn().mockResolvedValue(true),
      };

      const mockResult = {
        answers: [{ questionIndex: 0, selectedIndex: 1, correct: true }],
        score: 1,
        save: vi.fn(),
      };

      mockQuizModel.findOne.mockResolvedValue(mockQuiz);
      (mockQuizResultModel as any).findOne.mockResolvedValue(mockResult);

      const result = await service.answer(userId, quizId, {
        questionIndex: 0,
        selectedIndex: 1,
      });

      expect(result.correct).toBe(true);
      expect(result.correctIndex).toBe(1);
      expect(mockResult.save).not.toHaveBeenCalled();
    });
  });

  describe('getResult', () => {
    it('should throw NotFoundException if result does not exist', async () => {
      (mockQuizResultModel as any).findOne.mockResolvedValue(null);

      await expect(service.getResult(userId, quizId)).rejects.toThrow(NotFoundException);
    });

    it('should return result summary', async () => {
      (mockQuizResultModel as any).findOne.mockResolvedValue({
        score: 8,
        totalQuestions: 10,
        completedAt: new Date('2026-10-25T12:00:00Z'),
        answers: [],
      });

      const res = await service.getResult(userId, quizId);
      expect(res.quizId).toBe(quizId);
      expect(res.score).toBe(8);
      expect(res.total).toBe(10);
    });
  });
});
