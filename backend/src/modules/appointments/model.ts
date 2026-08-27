import mongoose, { Schema, Document } from 'mongoose';
import { Appointment as IAppointment } from '@miturnouy/types';

export interface AppointmentDocument extends Omit<IAppointment, 'id' | 'clientId' | 'professionalId' | 'serviceId' | 'couponId'>, Document {
  clientId: Schema.Types.ObjectId;
  professionalId: Schema.Types.ObjectId;
  serviceId: Schema.Types.ObjectId;
  couponId?: Schema.Types.ObjectId;
}

const StatusHistoryEntrySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
      required: true,
    },
    comment: { type: String, trim: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const AppointmentSchema = new Schema<any>(
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
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    startTime: {
      type: String, // HH:MM
      required: true,
    },
    endTime: {
      type: String, // HH:MM
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    statusHistory: {
      type: [StatusHistoryEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        ret['id'] = ret['_id'].toString();
        
        const stringifyId = (val: any) => {
          if (!val) return val;
          if (typeof val === 'string') return val;
          if (val instanceof mongoose.Types.ObjectId || (typeof val === 'object' && typeof val.toHexString === 'function')) {
            return val.toString();
          }
          return val;
        };

        ret['businessId'] = stringifyId(ret['businessId']);
        ret['clientId'] = stringifyId(ret['clientId']);
        ret['professionalId'] = stringifyId(ret['professionalId']);
        ret['serviceId'] = stringifyId(ret['serviceId']);
        if (ret['couponId']) ret['couponId'] = stringifyId(ret['couponId']);
        
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

// Indexes to speed up queries on agenda scheduling conflicts and date ranges
AppointmentSchema.index({ businessId: 1, date: 1, startTime: 1 });
AppointmentSchema.index({ businessId: 1, professionalId: 1, date: 1 });
AppointmentSchema.index({ businessId: 1, status: 1 });

export const AppointmentModel = mongoose.models.Appointment || mongoose.model<AppointmentDocument>('Appointment', AppointmentSchema);
export default AppointmentModel;


