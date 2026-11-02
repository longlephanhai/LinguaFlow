import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiService } from '../ai/ai.service.js';
import { EvaluateShadowingDto } from './dto/evaluate-shadowing.dto.js';
import { ShadowingAttempt } from './schemas/shadowing-attempt.schema.js';

@Injectable()
export class ShadowingService {
  constructor(
    @InjectModel(ShadowingAttempt.name)
    private readonly shadowingAttemptModel: Model<ShadowingAttempt>,
    private readonly aiService: AiService,
  ) {}

  async evaluate(userId: string, dto: EvaluateShadowingDto) {
    const evaluation = await this.aiService.evaluateSpeech(
      dto.targetText,
      dto.userTranscript || '',
      dto.userAudioBase64,
    );

    await this.shadowingAttemptModel.create({
      userId: new Types.ObjectId(userId),
      videoId: dto.videoId || undefined,
      segmentIndex: dto.segmentIndex !== undefined ? dto.segmentIndex : undefined,
      targetText: dto.targetText,
      transcribedText: evaluation.transcribedText,
      overallScore: evaluation.overallScore,
      wordsEvaluation: evaluation.wordsEvaluation,
      audioUrl: undefined,
    });

    return {
      overallScore: evaluation.overallScore,
      transcribedText: evaluation.transcribedText,
      wordsEvaluation: evaluation.wordsEvaluation,
      generalTips: evaluation.generalTips,
    };
  }
}
