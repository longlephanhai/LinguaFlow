import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class ReviewState {
  @Prop({ default: 2.5 })
  easeFactor: number;

  @Prop({ default: 1 })
  intervalDays: number;

  @Prop({ default: 0 })
  repetitions: number;

  @Prop({ type: Date, default: () => new Date(), index: true })
  dueDate: Date;

  @Prop({ type: Date, default: null })
  lastReviewedAt: Date | null;

  @Prop({ default: false })
  suspended: boolean;
}

export const ReviewStateSchema = SchemaFactory.createForClass(ReviewState);

@Schema({ _id: false })
export class MediaMetadata {
  @Prop({ type: String, enum: ['youtube', 'netflix', 'web'], default: null })
  provider: 'youtube' | 'netflix' | 'web' | null;

  @Prop({ type: String, default: null, trim: true })
  videoId: string | null;

  @Prop({ type: Number, default: null })
  timestampSeconds: number | null;

  @Prop({ type: String, default: null, trim: true })
  videoTitle: string | null;

  @Prop({ type: String, default: null, trim: true })
  audioSnippetUrl: string | null;
}

export const MediaMetadataSchema = SchemaFactory.createForClass(MediaMetadata);

@Schema({ timestamps: true, collection: 'occurrences' })
export class Occurrence extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Meaning', required: true, index: true })
  meaningId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'VocabularyItem', required: true, index: true })
  vocabularyItemId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  selectedText: string;

  @Prop({ required: true, trim: true })
  sentence: string;

  @Prop({ required: true, trim: true })
  sourceUrl: string;

  @Prop({ type: String, default: null, trim: true })
  sourceTitle: string | null;

  @Prop({ type: Date, default: () => new Date() })
  capturedAt: Date;

  @Prop({ type: MediaMetadataSchema, default: null })
  mediaMetadata?: MediaMetadata | null;

  @Prop({ type: ReviewStateSchema, default: () => ({}) })
  review: ReviewState;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const OccurrenceSchema = SchemaFactory.createForClass(Occurrence);

// Compound indexes
OccurrenceSchema.index({ userId: 1, 'review.dueDate': 1, isDeleted: 1 });
OccurrenceSchema.index({ meaningId: 1, isDeleted: 1 });
OccurrenceSchema.index({ vocabularyItemId: 1, isDeleted: 1 });
