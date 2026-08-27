import mongoose, { Schema, Document } from 'mongoose';

export interface WaitlistDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  professionalId: mongoose.Types.ObjectId;
  requestedDate: string; // YYYY-MM-DD
  contactEmail: string;
  contactPhone?: string;
  status: 'PENDING' | 'NOTIFIED' | 'BOOKED' | 'CANCELLED';
  createdAt: Date;
}

const WaitlistSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
    },
    requestedDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    contactEmail: {
      type: String,
      required: true,
    },
    contactPhone: {
      type: String,
    },
    status: {
      type: String,
      enum: ['PENDING', 'NOTIFIED', 'BOOKED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        ret['id'] = ret['_id'].toString();
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

// Índice compuesto para buscar rápidamente por negocio, fecha y servicio
WaitlistSchema.index({ businessId: 1, requestedDate: 1, status: 1 });

export const WaitlistModel = mongoose.models.Waitlist || mongoose.model<WaitlistDocument>('Waitlist', WaitlistSchema);
export default WaitlistModel;
