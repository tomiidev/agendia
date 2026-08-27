import mongoose, { Schema, Document } from 'mongoose';
import { Business as IBusiness } from '@miturnouy/types';

export interface BusinessDocument extends Omit<IBusiness, 'id'>, Document {}

const SlotSchema = new Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const DayScheduleSchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isOpen: { type: Boolean, required: true, default: true },
    slots: { type: [SlotSchema], default: [] },
  },
  { _id: false }
);

const WeeklyScheduleSchema = new Schema(
  {
    days: { type: [DayScheduleSchema], required: true },
  },
  { _id: false }
);

const BusinessSettingsSchema = new Schema(
  {
    businessHours: { type: WeeklyScheduleSchema, required: true },
    timezone: { type: String, required: true, default: 'America/Argentina/Buenos_Aires' },
    calendar: {
      primaryColor: { type: String, default: '#7C3AED' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      viewMode: { type: String, enum: ['day', 'week', 'month'], default: 'week' },
      showWeekends: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const BusinessSchema = new Schema<any>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    type: { type: String, required: true },
    description: { type: String, trim: true },
    logo: { type: String },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    active: { type: Boolean, default: true },
    settings: { type: BusinessSettingsSchema, required: true },
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

export const BusinessModel = mongoose.models.Business || mongoose.model<BusinessDocument>('Business', BusinessSchema);
export default BusinessModel;


