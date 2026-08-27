import mongoose, { Schema, Document } from 'mongoose';
import { QuoteRequest as IQuoteRequest } from '@miturnouy/types';

export interface QuoteRequestDocument extends Omit<IQuoteRequest, 'id' | 'businessId' | 'serviceId' | 'clientId'>, Document {
  businessId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
}

const QuoteRequestSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONTACTED', 'CLOSED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        ret['id'] = ret['_id'].toString();
        ret['businessId'] = ret['businessId'].toString();
        
        // If not populated, these will be ObjectIds (which stringify to their hex representation)
        // If populated, they will be objects. We want to keep the object if it's populated.
        
        // No manual override here for serviceId/clientId to allow populated objects to pass through
        
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

// Compound index to quickly fetch by business, status and date
QuoteRequestSchema.index({ businessId: 1, status: 1, createdAt: -1 });

export const QuoteRequestModel = mongoose.models.QuoteRequest || mongoose.model<QuoteRequestDocument>('QuoteRequest', QuoteRequestSchema);
export default QuoteRequestModel;
