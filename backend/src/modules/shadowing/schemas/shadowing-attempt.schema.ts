import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShadowingAttemptDocument = ShadowingAttempt & Document;

@Schema({ _id: false })
export class WordEvaluationItem {
  @Prop({ type: String, required: true })
  word!: string;

  @Prop({
    type: String,
    enum: ['correct', 'minor_error', 'mispronounced', 'omitted'],
    required: true,
  })
  status!: 'correct' | 'minor_error' | 'mispronounced' | 'omitted';

  @Prop({ type: String, default: null })
  phonemeFeedback?: string | null;
}

export const WordEvaluationItemSchema = SchemaFactory.createForClass(WordEvaluationItem);

@Schema({ collection: 'shadowingAttempts', timestamps: { createdAt: true, updatedAt: false } })
export class ShadowingAttempt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, default: null })
  videoId?: string | null;

  @Prop({ type: Number, default: null })
  segmentIndex?: number | null;

  @Prop({ type: String, required: true })
  targetText!: string;

  @Prop({ type: String, required: true })
  transcribedText!: string;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  overallScore!: number;

  @Prop({ type: [WordEvaluationItemSchema], default: [] })
  wordsEvaluation!: WordEvaluationItem[];

  @Prop({ type: String, default: null })
  audioUrl?: string | null;

  createdAt?: Date;
}

export const ShadowingAttemptSchema = SchemaFactory.createForClass(ShadowingAttempt);
ShadowingAttemptSchema.index({ userId: 1, createdAt: -1 });
