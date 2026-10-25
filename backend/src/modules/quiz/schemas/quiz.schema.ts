import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class QuizQuestion {
  @Prop({ type: Types.ObjectId, ref: 'Occurrence', required: true })
  occurrenceId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  questionText: string;

  @Prop({ type: [String], required: true, validate: [(val: string[]) => val.length === 4, 'Must have exactly 4 options'] })
  options: [string, string, string, string];

  @Prop({ required: true, min: 0, max: 3 })
  correctIndex: number;

  @Prop({ required: true, trim: true })
  explanation: string;
}

export const QuizQuestionSchema = SchemaFactory.createForClass(QuizQuestion);

@Schema({ timestamps: true, collection: 'quizzes' })
export class Quiz extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['all', 'recent'], required: true, default: 'all' })
  scope: 'all' | 'recent';

  @Prop({ required: true, default: 10 })
  questionCount: number;

  @Prop({ type: [QuizQuestionSchema], required: true })
  questions: QuizQuestion[];

  @Prop({ type: String, enum: ['pending', 'completed', 'abandoned'], default: 'pending', index: true })
  status: 'pending' | 'completed' | 'abandoned';

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

QuizSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
QuizSchema.index({ userId: 1, status: 1 });
