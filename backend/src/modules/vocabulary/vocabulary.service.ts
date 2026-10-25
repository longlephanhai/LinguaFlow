import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VocabularyItem } from './schemas/vocabulary-item.schema.js';
import { Meaning } from './schemas/meaning.schema.js';
import { Occurrence } from './schemas/occurrence.schema.js';
import { SaveOccurrenceDto } from './dto/save-occurrence.dto.js';
import { QueryVocabularyDto } from './dto/query-vocabulary.dto.js';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto.js';
import { LookupVocabularyDto } from './dto/lookup-vocabulary.dto.js';
import { AiService } from '../ai/ai.service.js';

@Injectable()
export class VocabularyService {
  constructor(
    @InjectModel(VocabularyItem.name)
    private readonly vocabularyItemModel: Model<VocabularyItem>,
    @InjectModel(Meaning.name)
    private readonly meaningModel: Model<Meaning>,
    @InjectModel(Occurrence.name)
    private readonly occurrenceModel: Model<Occurrence>,
    private readonly aiService: AiService,
  ) {}

  async lookup(dto: LookupVocabularyDto) {
    return this.aiService.lookupInContext(dto.selectedText, dto.contextText);
  }

  async saveOccurrence(dto: SaveOccurrenceDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const lemmaNormalized = dto.lemma.trim().toLowerCase();

    // 1. Layer 1: Find, restore, or create VocabularyItem
    let vocabItem = await this.vocabularyItemModel.findOne({
      userId: userObjectId,
      lemma: lemmaNormalized,
    });

    if (vocabItem) {
      if (vocabItem.isDeleted) {
        vocabItem.isDeleted = false;
        vocabItem.deletedAt = null;
        if (dto.partOfSpeech) vocabItem.partOfSpeech = dto.partOfSpeech;
        await vocabItem.save();
      } else if (dto.partOfSpeech && !vocabItem.partOfSpeech) {
        vocabItem.partOfSpeech = dto.partOfSpeech;
        await vocabItem.save();
      }
    } else {
      vocabItem = await this.vocabularyItemModel.create({
        userId: userObjectId,
        lemma: lemmaNormalized,
        partOfSpeech: dto.partOfSpeech || null,
      });
    }

    // 2. Layer 2: Find, restore, or create Meaning
    const definitionNormalized = dto.meaning.trim();
    let meaning = await this.meaningModel.findOne({
      vocabularyItemId: vocabItem._id,
      userId: userObjectId,
      definition: definitionNormalized,
    });

    if (meaning) {
      if (meaning.isDeleted) {
        meaning.isDeleted = false;
        meaning.deletedAt = null;
        if (dto.example) meaning.example = dto.example;
        await meaning.save();
      }
    } else {
      meaning = await this.meaningModel.create({
        vocabularyItemId: vocabItem._id,
        userId: userObjectId,
        definition: definitionNormalized,
        example: dto.example?.trim() || '',
        aiModel: 'gemini-2.0-flash',
      });
    }

    // 3. Layer 3: Create Occurrence
    const occurrence = await this.occurrenceModel.create({
      meaningId: meaning._id,
      vocabularyItemId: vocabItem._id,
      userId: userObjectId,
      selectedText: dto.selectedText?.trim() || dto.lemma.trim(),
      sentence: dto.sentence.trim(),
      sourceUrl: dto.sourceUrl.trim(),
      sourceTitle: dto.sourceTitle?.trim() || null,
      capturedAt: new Date(),
      review: {
        easeFactor: 2.5,
        intervalDays: 1,
        repetitions: 0,
        dueDate: new Date(),
        lastReviewedAt: null,
        suspended: false,
      },
    });

    return {
      occurrenceId: occurrence._id.toString(),
      vocabularyItemId: vocabItem._id.toString(),
      meaningId: meaning._id.toString(),
    };
  }

  async findAll(userId: string, query: QueryVocabularyDto) {
    const userObjectId = new Types.ObjectId(userId);
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      userId: userObjectId,
      isDeleted: false,
    };

    if (query.search?.trim()) {
      filter.lemma = { $regex: query.search.trim(), $options: 'i' };
    }

    const [total, items] = await Promise.all([
      this.vocabularyItemModel.countDocuments(filter),
      this.vocabularyItemModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const itemsWithCounts = await Promise.all(
      items.map(async (item) => {
        const [meaningsCount, occurrencesCount] = await Promise.all([
          this.meaningModel.countDocuments({
            vocabularyItemId: item._id,
            isDeleted: false,
          }),
          this.occurrenceModel.countDocuments({
            vocabularyItemId: item._id,
            isDeleted: false,
          }),
        ]);

        return {
          id: item._id.toString(),
          lemma: item.lemma,
          partOfSpeech: item.partOfSpeech,
          meaningsCount,
          occurrencesCount,
          createdAt: (item as any).createdAt,
        };
      }),
    );

    return {
      items: itemsWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOccurrences(userId: string, itemId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const itemObjectId = new Types.ObjectId(itemId);

    const item = await this.vocabularyItemModel.findOne({
      _id: itemObjectId,
      userId: userObjectId,
      isDeleted: false,
    });

    if (!item) {
      throw new NotFoundException('Vocabulary item not found');
    }

    const occurrences = await this.occurrenceModel
      .find({
        vocabularyItemId: itemObjectId,
        userId: userObjectId,
        isDeleted: false,
      })
      .populate('meaningId')
      .sort({ capturedAt: -1 })
      .lean();

    return {
      occurrences: occurrences.map((occ) => {
        const meaning = occ.meaningId as any;
        return {
          id: occ._id.toString(),
          sentence: occ.sentence,
          selectedText: occ.selectedText,
          sourceUrl: occ.sourceUrl,
          sourceTitle: occ.sourceTitle,
          meaning: meaning?.definition || '',
          definition: meaning?.definition || '',
          example: meaning?.example || '',
          capturedAt: occ.capturedAt,
          review: occ.review,
        };
      }),
    };
  }

  async updateOccurrence(userId: string, occurrenceId: string, dto: UpdateOccurrenceDto) {
    const userObjectId = new Types.ObjectId(userId);
    const occObjectId = new Types.ObjectId(occurrenceId);

    const occ = await this.occurrenceModel.findOne({
      _id: occObjectId,
      userId: userObjectId,
      isDeleted: false,
    });

    if (!occ) {
      throw new NotFoundException('Occurrence not found');
    }

    if (dto.sentence !== undefined) {
      occ.sentence = dto.sentence.trim();
      await occ.save();
    }

    if (dto.meaning !== undefined || dto.example !== undefined) {
      await this.meaningModel.updateOne(
        { _id: occ.meaningId, userId: userObjectId },
        {
          $set: {
            ...(dto.meaning !== undefined && { definition: dto.meaning.trim() }),
            ...(dto.example !== undefined && { example: dto.example.trim() }),
          },
        },
      );
    }

    return { success: true };
  }

  async deleteOccurrence(userId: string, occurrenceId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const occObjectId = new Types.ObjectId(occurrenceId);

    const occ = await this.occurrenceModel.findOneAndUpdate(
      { _id: occObjectId, userId: userObjectId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );

    if (!occ) {
      throw new NotFoundException('Occurrence not found');
    }

    return { success: true };
  }

  async deleteVocabularyItem(userId: string, itemId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const itemObjectId = new Types.ObjectId(itemId);

    const item = await this.vocabularyItemModel.findOneAndUpdate(
      { _id: itemObjectId, userId: userObjectId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
    );

    if (!item) {
      throw new NotFoundException('Vocabulary item not found');
    }

    // Cascading soft-delete meanings and occurrences
    const now = new Date();
    await Promise.all([
      this.meaningModel.updateMany(
        { vocabularyItemId: itemObjectId, userId: userObjectId, isDeleted: false },
        { isDeleted: true, deletedAt: now },
      ),
      this.occurrenceModel.updateMany(
        { vocabularyItemId: itemObjectId, userId: userObjectId, isDeleted: false },
        { isDeleted: true, deletedAt: now },
      ),
    ]);

    return { success: true };
  }
}
