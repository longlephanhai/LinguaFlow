import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DocumentRecordDocument = DocumentRecord & Document;

@Schema({ _id: false })
export class DiscoveredVocab {
  @Prop({ type: String, required: true })
  lemma!: string;

  @Prop({ type: String, default: 'noun' })
  partOfSpeech!: string;

  @Prop({ type: String, required: true })
  contextSentence!: string;

  @Prop({ type: String, required: true })
  definition!: string;

  @Prop({ type: Boolean, default: false })
  isSaved!: boolean;
}

export const DiscoveredVocabSchema = SchemaFactory.createForClass(DiscoveredVocab);

@Schema({ collection: 'documents', timestamps: true })
export class DocumentRecord {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({ type: String, default: null })
  sourceUrl!: string | null;

  @Prop({ type: Number, required: true, default: 0 })
  totalWordCount!: number;

  @Prop({ type: Number, required: true, default: 0 })
  extractedLemmasCount!: number;

  @Prop({ type: [DiscoveredVocabSchema], default: [] })
  discoveredVocabulary!: DiscoveredVocab[];

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DocumentRecordSchema = SchemaFactory.createForClass(DocumentRecord);
DocumentRecordSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });

