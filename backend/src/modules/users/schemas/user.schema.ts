import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class UserSettings {
  @Prop({ default: 20 })
  dailyReviewGoal: number;

  @Prop({ default: 10 })
  quizDefaultCount: number;

  @Prop({ required: true })
  timezone: string;
}

const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ type: String, default: null })
  avatarUrl: string | null;

  @Prop({ type: UserSettingsSchema, required: true })
  settings: UserSettings;

  @Prop({ type: String, default: null })
  refreshTokenHash: string | null;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
