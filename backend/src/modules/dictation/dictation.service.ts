import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RecordDictationSessionDto } from './dto/record-dictation-session.dto.js';
import { DictationSession } from './schemas/dictation-session.schema.js';

@Injectable()
export class DictationService {
  constructor(
    @InjectModel(DictationSession.name)
    private readonly dictationSessionModel: Model<DictationSession>,
  ) {}

  async recordSession(userId: string, dto: RecordDictationSessionDto) {
    const session = await this.dictationSessionModel.create({
      userId: new Types.ObjectId(userId),
      videoId: dto.videoId,
      completedSegments: dto.completedSegments,
      totalSegments: dto.totalSegments,
      accuracyScore: dto.accuracyScore,
      timeSpentSeconds: dto.timeSpentSeconds,
      mistakesCount: dto.mistakesCount,
    });

    return {
      sessionId: session._id.toString(),
      accuracyScore: session.accuracyScore,
      recordedAt: session.createdAt?.toISOString() || new Date().toISOString(),
    };
  }
}

