import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class TranscriptSegment {
  @Prop({ required: true })
  index: number;

  @Prop({ required: true })
  startSeconds: number;

  @Prop({ required: true })
  endSeconds: number;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ type: String, default: null, trim: true })
  translation: string | null;
}

export const TranscriptSegmentSchema = SchemaFactory.createForClass(TranscriptSegment);

@Schema({ timestamps: true, collection: 'videoTranscripts' })
export class VideoTranscript extends Document {
  @Prop({ required: true, default: 'youtube', trim: true })
  provider: string;

  @Prop({ required: true, index: true, trim: true })
  videoId: string;

  @Prop({ required: true, default: 'en', trim: true })
  language: string;

  @Prop({ required: true, trim: true })
  videoTitle: string;

  @Prop({ required: true, default: 0 })
  durationSeconds: number;

  @Prop({ type: [TranscriptSegmentSchema], default: [] })
  segments: TranscriptSegment[];

  createdAt: Date;
  updatedAt: Date;
}

export const VideoTranscriptSchema = SchemaFactory.createForClass(VideoTranscript);

VideoTranscriptSchema.index({ provider: 1, videoId: 1, language: 1 }, { unique: true });
