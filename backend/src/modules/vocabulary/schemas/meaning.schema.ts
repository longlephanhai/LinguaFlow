import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'meanings' })
export class Meaning extends Document {
  @Prop({ type: Types.ObjectId, ref: 'VocabularyItem', required: true, index: true })
  vocabularyItemId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  definition: string;

  @Prop({ default: '', trim: true })
  example: string;

  @Prop({ default: 'gemini-2.0-flash' })
  aiModel: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const MeaningSchema = SchemaFactory.createForClass(Meaning);

// Compound indexes
MeaningSchema.index({ vocabularyItemId: 1, isDeleted: 1 });
MeaningSchema.index({ userId: 1, isDeleted: 1 });
