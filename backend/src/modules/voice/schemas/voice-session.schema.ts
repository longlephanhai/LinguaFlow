import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoiceSessionDocument = VoiceSession & Document;

@Schema({ _id: false })
export class TargetVocabularySnapshot {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true, trim: true })
  lemma: string;

  @Prop({ type: String, required: true, trim: true })
  meaning: string;
}

export const TargetVocabularySnapshotSchema = SchemaFactory.createForClass(TargetVocabularySnapshot);

@Schema({ _id: false })
export class DialogueTurn {
  @Prop({ type: String, enum: ['user', 'assistant'], required: true })
  role: 'user' | 'assistant';

  @Prop({ type: String, required: true, trim: true })
  text: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: [String], default: [] })
  detectedTargetWords: string[];

  @Prop({ type: String, default: null })
  phrasingFeedback: string | null;
}

export const DialogueTurnSchema = SchemaFactory.createForClass(DialogueTurn);

@Schema({ _id: false })
export class SpokenMetrics {
  @Prop({ type: Number, default: 0 })
  totalWordsSpoken: number;

  @Prop({ type: Number, default: 0 })
  speakingPaceWpm: number;

  @Prop({ type: Number, default: 0 })
  fillerWordsCount: number;

  @Prop({ type: Number, default: 0 })
  activationRate: number;

  @Prop({ type: Number, default: 0 })
  conversationFluencyScore: number;
}

export const SpokenMetricsSchema = SchemaFactory.createForClass(SpokenMetrics);

@Schema({ timestamps: true, collection: 'voiceSessions' })
export class VoiceSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, default: 'casual_chat', trim: true })
  scenarioPreset: string;

  @Prop({ type: String, default: 'Everyday Conversation', trim: true })
  topic: string;

  @Prop({ type: Number, default: 0 })
  durationSeconds: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'VocabularyItem' }], default: [] })
  targetVocabularyItemIds: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'VocabularyItem' }], default: [] })
  usedVocabularyItemIds: Types.ObjectId[];

  @Prop({ type: [TargetVocabularySnapshotSchema], default: [] })
  targetVocabulary: TargetVocabularySnapshot[];

  @Prop({ type: [DialogueTurnSchema], default: [] })
  dialogueHistory: DialogueTurn[];

  @Prop({ type: SpokenMetricsSchema, default: () => ({}) })
  spokenMetrics: SpokenMetrics;

  @Prop({ type: String, default: null })
  dialogueSummary: string | null;

  @Prop({ type: [String], default: [] })
  naturalPhrasingTips: string[];

  @Prop({ type: String, enum: ['active', 'completed'], default: 'active' })
  status: 'active' | 'completed';

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const VoiceSessionSchema = SchemaFactory.createForClass(VoiceSession);

VoiceSessionSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
