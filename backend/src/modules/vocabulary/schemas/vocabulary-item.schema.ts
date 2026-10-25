import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'vocabularyItems' })
export class VocabularyItem extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true })
  lemma: string;

  @Prop({ type: String, default: null })
  partOfSpeech: string | null;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const VocabularyItemSchema = SchemaFactory.createForClass(VocabularyItem);

// Compound indexes
VocabularyItemSchema.index({ userId: 1, lemma: 1 }, { unique: true });
VocabularyItemSchema.index({ userId: 1, isDeleted: 1 });
