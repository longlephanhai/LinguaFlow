import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WritingReview } from './schemas/writing-review.schema.js';
import { AiService } from '../ai/ai.service.js';
import { VocabularyService } from '../vocabulary/vocabulary.service.js';
import { SubmitWritingDto } from './dto/submit-writing.dto.js';
import { WritingHistoryQueryDto } from './dto/writing-history-query.dto.js';

@Injectable()
export class WritingService {
  constructor(
    @InjectModel(WritingReview.name)
    private readonly writingReviewModel: Model<WritingReview>,
    private readonly aiService: AiService,
    private readonly vocabularyService: VocabularyService,
  ) {}

  async reviewWriting(userId: string, dto: SubmitWritingDto) {
    const trimmedText = dto.text.trim();
    if (trimmedText.length < 20) {
      throw new BadRequestException('Text must be at least 20 characters long');
    }
    if (trimmedText.length > 5000) {
      throw new BadRequestException('Text cannot exceed 5000 characters');
    }

    const words = trimmedText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Call AiService (wrapping resilient GeminiProvider)
    const aiResult = await this.aiService.reviewWriting(trimmedText);

    const review = new this.writingReviewModel({
      userId: new Types.ObjectId(userId),
      originalText: trimmedText,
      wordCount,
      feedback: aiResult.feedback,
      suggestions: aiResult.suggestions,
      aiModel: aiResult.aiModel || 'gemini-flash-lite-latest',
    });

    await review.save();

    return {
      _id: review._id.toString(),
      originalText: review.originalText,
      wordCount: review.wordCount,
      feedback: review.feedback,
      suggestions: review.suggestions,
      aiModel: review.aiModel,
      createdAt: review.createdAt,
    };
  }

  async getHistory(userId: string, query: WritingHistoryQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    };

    const [total, docs] = await Promise.all([
      this.writingReviewModel.countDocuments(filter),
      this.writingReviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const items = docs.map((doc: any) => ({
      _id: doc._id.toString(),
      originalText:
        doc.originalText.length > 100
          ? `${doc.originalText.slice(0, 97)}...`
          : doc.originalText,
      wordCount: doc.wordCount,
      suggestionsCount: doc.suggestions?.length || 0,
      createdAt: doc.createdAt,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getReviewById(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Writing review not found');
    }

    const doc = await this.writingReviewModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!doc) {
      throw new NotFoundException('Writing review not found');
    }

    return {
      _id: doc._id.toString(),
      originalText: doc.originalText,
      wordCount: doc.wordCount,
      feedback: doc.feedback,
      suggestions: doc.suggestions,
      aiModel: doc.aiModel,
      createdAt: doc.createdAt,
    };
  }

  async deleteReview(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Writing review not found');
    }

    const doc = await this.writingReviewModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!doc) {
      throw new NotFoundException('Writing review not found');
    }

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();

    return { success: true };
  }

  async getSuggestedWords(userId: string) {
    let lemmas: string[] = [];
    try {
      lemmas = await this.vocabularyService.getRecentLemmas(userId, 20);
    } catch {
      lemmas = [];
    }

    if (!lemmas || lemmas.length === 0) {
      return { words: [] };
    }

    // Return up to 6 unique random words
    const shuffled = [...new Set(lemmas)].sort(() => 0.5 - Math.random());
    const words = shuffled.slice(0, 6);

    return { words };
  }
}

