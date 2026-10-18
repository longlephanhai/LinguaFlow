import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Permission } from '../../permissions/schemas/permission.schema.js';

@Schema({ timestamps: true })
export class Role extends Document {
  @Prop({ required: true, unique: true, trim: true, index: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: Permission.name }], default: [] })
  permissions: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
RoleSchema.index({ isDeleted: 1 });
