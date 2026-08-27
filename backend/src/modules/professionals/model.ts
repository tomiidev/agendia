import mongoose, { Schema, Document } from 'mongoose';
import { Professional as IProfessional } from '../../shared/types';

export interface ProfessionalDocument extends Omit<IProfessional, 'id' | 'services'>, Document {
  services: Schema.Types.ObjectId[];
}

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

const ScheduleExceptionSchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    isOpen: { type: Boolean, required: true, default: false },
    slots: { type: [SlotSchema], default: [] },
  },
  { _id: false }
);

const ProfessionalSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
    },
    specialties: {
      type: [String],
      default: [],
    },
    services: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
      default: [],
    },
    calendarColor: {
      type: String,
      required: true,
      default: '#7C3AED',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    schedule: {
      type: WeeklyScheduleSchema,
      required: true,
    },
    exceptions: {
      type: [ScheduleExceptionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        ret['id'] = ret['_id'].toString();
        ret['businessId'] = ret['businessId'].toString();
        if (ret['userId']) ret['userId'] = ret['userId'].toString();
        ret['services'] = ret['services'].map((s: any) => s.toString());
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

export const ProfessionalModel = mongoose.models.Professional || mongoose.model<ProfessionalDocument>('Professional', ProfessionalSchema);
export default ProfessionalModel;


