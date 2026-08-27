import mongoose, { Schema, Document } from 'mongoose';
import { Membership as IMembership } from '../../shared/types';

export interface MembershipDocument extends Omit<IMembership, 'id'>, Document {}

const MembershipSchema = new Schema<any>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'PROFESSIONAL'],
      required: true,
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
        ret['userId'] = ret['userId'].toString();
        ret['businessId'] = ret['businessId'].toString();
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

// Compounding index to enforce single membership per business per user
MembershipSchema.index({ userId: 1, businessId: 1 }, { unique: true });

export const MembershipModel = mongoose.models.Membership || mongoose.model<MembershipDocument>('Membership', MembershipSchema);
export default MembershipModel;


