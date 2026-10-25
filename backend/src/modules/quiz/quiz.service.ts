import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz } from './schemas/quiz.schema.js';
import { QuizResult } from './schemas/quiz-result.schema.js';
import { Occurrence } from '../vocabulary/schemas/occurrence.schema.js';
import { VocabularyItem } from '../vocabulary/schemas/vocabulary-item.schema.js';
import { Meaning } from '../vocabulary/schemas/meaning.schema.js';
import { AiService } from '../ai/ai.service.js';
import { QuizItemInput } from '../ai/ai-provider.interface.js';
import { GenerateQuizDto } from './dto/generate-quiz.dto.js';
import { AnswerQuizDto } from './dto/answer-quiz.dto.js';
import { QuizHistoryQueryDto } from './dto/quiz-history-query.dto.js';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<Quiz>,
    @InjectModel(QuizResult.name)
    private readonly quizResultModel: Model<QuizResult>,
    @InjectModel(Occurrence.name)
    private readonly occurrenceModel: Model<Occurrence>,
    private readonly aiService: AiService,
  ) {}

  async generate(userId: string, dto: GenerateQuizDto) {
    const userObjId = new Types.ObjectId(userId);
    const filter: any = {
      userId: userObjId,
      isDeleted: false,
    };

    if (dto.scope === 'recent') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filter.capturedAt = { $gte: sevenDaysAgo };
    }

    const occurrences = await this.occurrenceModel
      .find(filter)
      .populate<{ vocabularyItemId: VocabularyItem }>('vocabularyItemId')
      .populate<{ meaningId: Meaning }>('meaningId')
      .exec();

    // EDGE-009: Insufficient items validation (< 4 words)
    if (occurrences.length < 4) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INSUFFICIENT_ITEMS',
          message: 'You need at least 4 saved words to generate a quiz. Keep learning!',
        },
      });
    }

    // Shuffle and pick target count
    const shuffled = [...occurrences].sort(() => 0.5 - Math.random());
    const targetCount = Math.min(dto.count || 10, shuffled.length);
    const selectedOccurrences = shuffled.slice(0, targetCount);

    const items: QuizItemInput[] = selectedOccurrences.map((occ) => {
      const vocab = occ.vocabularyItemId as VocabularyItem | null;
      const meaning = occ.meaningId as Meaning | null;
      return {
        occurrenceId: occ._id.toString(),
        selectedText: occ.selectedText,
        sentence: occ.sentence,
        lemma: vocab?.lemma ?? occ.selectedText,
        meaning: meaning?.definition ?? '',
      };
    });

    const generatedQuestions = await this.aiService.generateQuiz(items, targetCount);

    const quiz = await this.quizModel.create({
      userId: userObjId,
      scope: dto.scope || 'all',
      questionCount: generatedQuestions.length,
      questions: generatedQuestions.map((q) => ({
        occurrenceId: new Types.ObjectId(q.occurrenceId),
        questionText: q.questionText,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
      status: 'pending',
    });

    // Withhold correctIndex & explanation from initial response
    return {
      quizId: quiz._id.toString(),
      questions: quiz.questions.map((q, idx) => ({
        index: idx,
        questionText: q.questionText,
        options: q.options,
      })),
    };
  }

  async answer(userId: string, quizId: string, dto: AnswerQuizDto) {
    const userObjId = new Types.ObjectId(userId);
    const quizObjId = new Types.ObjectId(quizId);

    const quiz = await this.quizModel.findOne({
      _id: quizObjId,
      userId: userObjId,
      isDeleted: false,
    });

    if (!quiz) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Quiz not found',
        },
      });
    }

    if (dto.questionIndex < 0 || dto.questionIndex >= quiz.questions.length) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid question index',
        },
      });
    }

    const targetQuestion = quiz.questions[dto.questionIndex];

    let quizResult = await this.quizResultModel.findOne({
      quizId: quizObjId,
      userId: userObjId,
      isDeleted: false,
    });

    if (!quizResult) {
      quizResult = new this.quizResultModel({
        quizId: quizObjId,
        userId: userObjId,
        answers: [],
        score: 0,
        totalQuestions: quiz.questions.length,
        completedAt: new Date(),
      });
    }

    // Idempotent re-submission (FR-QUIZ-003 AC-3)
    const existingAnswer = quizResult.answers.find((a) => a.questionIndex === dto.questionIndex);
    if (existingAnswer) {
      return {
        correct: existingAnswer.correct,
        correctIndex: targetQuestion.correctIndex,
        explanation: targetQuestion.explanation,
      };
    }

    const isCorrect = dto.selectedIndex === targetQuestion.correctIndex;
    quizResult.answers.push({
      questionIndex: dto.questionIndex,
      selectedIndex: dto.selectedIndex,
      correct: isCorrect,
      timeSpentMs: dto.timeSpentMs ?? null,
    });

    if (isCorrect) {
      quizResult.score += 1;
    }

    // If all questions answered, mark complete
    if (quizResult.answers.length >= quiz.questions.length) {
      quiz.status = 'completed';
      quiz.completedAt = new Date();
      quizResult.completedAt = new Date();
      await quiz.save();
    }

    await quizResult.save();

    return {
      correct: isCorrect,
      correctIndex: targetQuestion.correctIndex,
      explanation: targetQuestion.explanation,
    };
  }

  async getResult(userId: string, quizId: string) {
    const userObjId = new Types.ObjectId(userId);
    const quizObjId = new Types.ObjectId(quizId);

    const quizResult = await this.quizResultModel.findOne({
      quizId: quizObjId,
      userId: userObjId,
      isDeleted: false,
    });

    if (!quizResult) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Quiz result not found',
        },
      });
    }

    return {
      quizId,
      score: quizResult.score,
      total: quizResult.totalQuestions,
      completedAt: quizResult.completedAt,
      answers: quizResult.answers,
    };
  }

  async getHistory(userId: string, query: QuizHistoryQueryDto) {
    const userObjId = new Types.ObjectId(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [quizzes, total] = await Promise.all([
      this.quizModel
        .find({
          userId: userObjId,
          status: 'completed',
          isDeleted: false,
        })
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.quizModel.countDocuments({
        userId: userObjId,
        status: 'completed',
        isDeleted: false,
      }),
    ]);

    const quizIds = quizzes.map((q) => q._id);
    const results = await this.quizResultModel
      .find({
        quizId: { $in: quizIds },
        userId: userObjId,
        isDeleted: false,
      })
      .lean();

    const resultMap = new Map(results.map((r) => [r.quizId.toString(), r]));

    const items = quizzes.map((q) => {
      const res = resultMap.get(q._id.toString());
      return {
        quizId: q._id.toString(),
        score: res?.score ?? 0,
        total: res?.totalQuestions ?? q.questionCount,
        scope: q.scope,
        completedAt: q.completedAt || (q as any).updatedAt,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
