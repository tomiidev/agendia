import mongoose, { Schema, Document } from 'mongoose';
import { Service as IService } from '../../shared/types';

export interface ServiceDocument extends Omit<IService, 'id' | 'professionals'>, Document {
  professionals: Schema.Types.ObjectId[];
}

const ServiceSchema = new Schema<any>(
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
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 1, // in minutes
    },
    bufferBefore: {
      type: Number,
      default: 0, // in minutes
    },
    bufferAfter: {
      type: Number,
      default: 0, // in minutes
    },
    professionalsConfig: {
      type: [
        {
          professionalId: { type: Schema.Types.ObjectId, ref: 'Professional' },
          availabilityDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
        },
      ],
      default: [],
    },
    imageUrl: {
      type: String,
    },
    bookingMode: {
      type: String,
      enum: ['DIRECT', 'QUOTE', 'BOTH'],
      default: 'DIRECT',
      required: true,
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
        
        // Handle professionalsConfig: if populated, keep as objects; if ObjectIds, convert to strings
        if (Array.isArray(ret['professionalsConfig'])) {
          ret['professionalsConfig'] = ret['professionalsConfig'].map((p: any) => {
            if (p.professionalId && typeof p.professionalId === 'object' && p.professionalId._id) {
              return p; // It is populated, keep the object
            }
            return {
              ...p,
              professionalId: p.professionalId.toString(),
            };
          });
        }
        
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

export const ServiceModel = mongoose.models.Service || mongoose.model<ServiceDocument>('Service', ServiceSchema);
export default ServiceModel;


