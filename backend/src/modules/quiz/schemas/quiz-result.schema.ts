import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class QuizAnswerItem {
  @Prop({ required: true })
  questionIndex: number;

  @Prop({ required: true })
  selectedIndex: number;

  @Prop({ required: true })
  correct: boolean;

  @Prop({ type: Number, default: null })
  timeSpentMs: number | null;
}

export const QuizAnswerItemSchema = SchemaFactory.createForClass(QuizAnswerItem);

@Schema({ timestamps: true, collection: 'quizResults' })
export class QuizResult extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, unique: true, index: true })
  quizId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [QuizAnswerItemSchema], default: [] })
  answers: QuizAnswerItem[];

  @Prop({ required: true, default: 0 })
  score: number;

  @Prop({ required: true, default: 0 })
  totalQuestions: number;

  @Prop({ type: Date, default: () => new Date() })
  completedAt: Date;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const QuizResultSchema = SchemaFactory.createForClass(QuizResult);

QuizResultSchema.index({ userId: 1, isDeleted: 1, completedAt: -1 });
