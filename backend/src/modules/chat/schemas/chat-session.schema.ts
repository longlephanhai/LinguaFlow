import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class ChatMessage {
  @Prop({ type: String, enum: ['user', 'assistant'], required: true })
  role: 'user' | 'assistant';

  @Prop({ type: String, required: true, trim: true })
  content: string;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema({ timestamps: true, collection: 'chatSessions' })
export class ChatSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, default: null, trim: true })
  title: string | null;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages: ChatMessage[];

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

ChatSessionSchema.index({ userId: 1, isDeleted: 1, updatedAt: -1 });
