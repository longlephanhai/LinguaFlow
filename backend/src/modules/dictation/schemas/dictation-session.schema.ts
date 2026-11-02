import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DictationSessionDocument = DictationSession & Document;

@Schema({ collection: 'dictationSessions', timestamps: true })
export class DictationSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  videoId!: string;

  @Prop({ type: Number, required: true })
  totalSegments!: number;

  @Prop({ type: Number, required: true })
  completedSegments!: number;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  accuracyScore!: number;

  @Prop({ type: Number, required: true, default: 0 })
  timeSpentSeconds!: number;

  @Prop({ type: Number, required: true, default: 0 })
  mistakesCount!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DictationSessionSchema = SchemaFactory.createForClass(DictationSession);
DictationSessionSchema.index({ userId: 1, createdAt: -1 });
