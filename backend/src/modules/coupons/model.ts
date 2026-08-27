import mongoose, { Schema, Document } from 'mongoose';
import { Coupon as ICoupon } from '../../shared/types';

export interface CouponDocument extends Omit<ICoupon, 'id' | 'specificServices'>, Document {
  specificServices: Schema.Types.ObjectId[];
}

const CouponSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    endDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    maxUses: {
      type: Number,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsesPerClient: {
      type: Number,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    specificServices: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        ret['id'] = ret['_id'].toString();
        ret['businessId'] = ret['businessId'].toString();
        
        // Handle specificServices: if populated, keep as objects; if ObjectIds, convert to strings
        if (Array.isArray(ret['specificServices'])) {
          ret['specificServices'] = ret['specificServices'].map((s: any) => {
            if (s && typeof s === 'object' && s._id) {
              return s; // It is populated, keep the object
            }
            return s.toString(); // It is an ObjectId, convert to string
          });
        }
        
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

// Enforce unique coupon code *within* the same business
CouponSchema.index({ businessId: 1, code: 1 }, { unique: true });

export const CouponModel = mongoose.models.Coupon || mongoose.model<CouponDocument>('Coupon', CouponSchema);
export default CouponModel;


