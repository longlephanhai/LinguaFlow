import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'aiCache' })
export class AiCache extends Document {
  @Prop({ required: true, unique: true, index: true })
  hash: string;

  @Prop({ required: true, trim: true })
  meaning: string;

  @Prop({ required: true, trim: true })
  example: string;

  @Prop({ type: String, default: null, trim: true })
  lemma: string | null;

  @Prop({ type: String, default: null, trim: true })
  partOfSpeech: string | null;

  @Prop({ default: 'gemini-2.0-flash' })
  aiModel: string;

  @Prop({ type: Date, default: () => new Date(), index: { expires: 604800 } })
  createdAt: Date;
}

export const AiCacheSchema = SchemaFactory.createForClass(AiCache);
