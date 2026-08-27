import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser } from '@miturnouy/types';

export interface UserDocument extends Omit<IUser, 'id'>, Document {
  passwordHash: string;
}

const UserSchema = new Schema<any>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        ret['id'] = ret['_id'].toString();
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        ret['passwordHash'] = undefined;
        return ret;
      },
    },
  }
);

export const UserModel = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
export default UserModel;


