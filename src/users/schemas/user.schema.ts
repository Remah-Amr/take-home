import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
    },
  },
})
export class User {
  _id?: number;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String, unique: true })
  email?: string;

  @Prop({ type: String })
  googleId: string;

  @Prop({ type: String })
  facebookId: string;

  @Prop({ type: String })
  outlookId: string;

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = User & Document;

export const userSchema = SchemaFactory.createForClass(User);
