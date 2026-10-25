import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Occurrence } from '../vocabulary/schemas/occurrence.schema.js';
import { VocabularyItem } from '../vocabulary/schemas/vocabulary-item.schema.js';
import { Meaning } from '../vocabulary/schemas/meaning.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { ReviewResultDto } from './dto/review-result.dto.js';
import { SuspendCardDto } from './dto/suspend-card.dto.js';
import { scheduleNext } from './srs.scheduler.js';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Occurrence.name)
    private readonly occurrenceModel: Model<Occurrence>,
    @InjectModel(VocabularyItem.name)
    private readonly vocabularyItemModel: Model<VocabularyItem>,
    @InjectModel(Meaning.name)
    private readonly meaningModel: Model<Meaning>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getDueOccurrences(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userObjId).select('settings').lean();
    const dailyGoal = user?.settings?.dailyReviewGoal ?? 20;

    const dueOccurrences = await this.occurrenceModel
      .find({
        userId: userObjId,
        isDeleted: false,
        'review.suspended': { $ne: true },
        'review.dueDate': { $lte: new Date() },
      })
      .sort({ 'review.dueDate': 1 })
      .limit(dailyGoal)
      .populate<{ vocabularyItemId: VocabularyItem }>('vocabularyItemId')
      .populate<{ meaningId: Meaning }>('meaningId')
      .exec();

    const occurrences = dueOccurrences.map((occ) => {
      const vocab = occ.vocabularyItemId as VocabularyItem | null;
      const meaning = occ.meaningId as Meaning | null;

      return {
        id: occ._id.toString(),
        occurrenceId: occ._id.toString(),
        lemma: vocab?.lemma ?? occ.selectedText,
        partOfSpeech: vocab?.partOfSpeech ?? null,
        selectedText: occ.selectedText,
        sentence: occ.sentence,
        meaning: meaning?.definition ?? '',
        definition: meaning?.definition ?? '',
        example: meaning?.example ?? '',
        sourceUrl: occ.sourceUrl,
        sourceTitle: occ.sourceTitle,
        review: {
          easeFactor: occ.review?.easeFactor ?? 2.5,
          intervalDays: occ.review?.intervalDays ?? 1,
          repetitions: occ.review?.repetitions ?? 0,
          dueDate: occ.review?.dueDate,
        },
      };
    });

    return { occurrences };
  }

  async recordReviewResult(userId: string, occurrenceId: string, dto: ReviewResultDto) {
    if (!Types.ObjectId.isValid(occurrenceId)) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Occurrence not found' },
      });
    }

    const occ = await this.occurrenceModel.findOne({
      _id: new Types.ObjectId(occurrenceId),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!occ) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Occurrence not found' },
      });
    }

    const currentReview = occ.review ?? {
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 0,
      suspended: false,
    };

    const next = scheduleNext({
      remembered: dto.remembered,
      easeFactor: currentReview.easeFactor ?? 2.5,
      repetitions: currentReview.repetitions ?? 0,
      intervalDays: currentReview.intervalDays ?? 1,
      today: new Date(),
    });

    occ.review = {
      easeFactor: next.easeFactor,
      repetitions: next.repetitions,
      intervalDays: next.intervalDays,
      dueDate: next.dueDate,
      lastReviewedAt: new Date(),
      suspended: occ.review?.suspended ?? false,
    };

    await occ.save();

    return {
      nextDueDate: next.dueDate.toISOString(),
      intervalDays: next.intervalDays,
    };
  }

  async suspendCard(userId: string, occurrenceId: string, dto: SuspendCardDto) {
    if (!Types.ObjectId.isValid(occurrenceId)) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Occurrence not found' },
      });
    }

    const occ = await this.occurrenceModel.findOne({
      _id: new Types.ObjectId(occurrenceId),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!occ) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Occurrence not found' },
      });
    }

    if (!occ.review) {
      occ.review = {
        easeFactor: 2.5,
        intervalDays: 1,
        repetitions: 0,
        dueDate: new Date(),
        lastReviewedAt: null,
        suspended: dto.suspended,
      };
    } else {
      occ.review.suspended = dto.suspended;
    }

    await occ.save();

    return {
      success: true,
      suspended: dto.suspended,
    };
  }
}
