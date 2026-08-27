import mongoose, { Schema, Document } from 'mongoose';
import { Promotion as IPromotion } from '../../shared/types';

export interface PromotionDocument extends Omit<IPromotion, 'id' | 'serviceId'>, Document {
  serviceId: Schema.Types.ObjectId;
}

const PromotionSchema = new Schema<any>(
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
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    startDayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String, // HH:MM
    },
    endTime: {
      type: String, // HH:MM
    },
    startDate: {
      type: String, // YYYY-MM-DD
    },
    endDate: {
      type: String, // YYYY-MM-DD
    },
    forNewClients: {
      type: Boolean,
      default: false,
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
        
        const stringifyId = (val: any) => {
          if (!val) return val;
          if (typeof val === 'string') return val;
          // If it's an ObjectId or something with a toHexString (like ObjectId), stringify it.
          if (val instanceof mongoose.Types.ObjectId || (typeof val === 'object' && typeof val.toHexString === 'function')) {
            return val.toString();
          }
          // If it's something else (presumably a populated object), don't stringify it, return it.
          return val;
        };

        ret['serviceId'] = stringifyId(ret['serviceId']);
        
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

export const PromotionModel = mongoose.models.Promotion || mongoose.model<PromotionDocument>('Promotion', PromotionSchema);
export default PromotionModel;


