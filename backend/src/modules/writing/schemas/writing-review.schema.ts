import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'writingReviews' })
export class WritingReview extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  originalText: string;

  @Prop({ type: Number, required: true })
  wordCount: number;

  @Prop({ type: String, required: true })
  feedback: string;

  @Prop({ type: [String], default: [] })
  suggestions: string[];

  @Prop({ type: String, default: 'gemini-flash-lite-latest' })
  aiModel: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const WritingReviewSchema = SchemaFactory.createForClass(WritingReview);

WritingReviewSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
