import mongoose, { Schema, Document } from 'mongoose';
import { Client as IClient } from '../../shared/types';

export interface ClientDocument extends Omit<IClient, 'id'>, Document {}

const ClientSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    lastOtpCode: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        ret['id'] = ret['_id'].toString();
        ret['businessId'] = ret['businessId'].toString();
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

// Compounding index for searching client within a specific tenant
ClientSchema.index({ businessId: 1, phone: 1 });
ClientSchema.index({ businessId: 1, name: 1 });

export const ClientModel = mongoose.models.Client || mongoose.model<ClientDocument>('Client', ClientSchema);
export default ClientModel;


