import { ServiceModel } from '../services/model';
import { ProfessionalModel } from '../professionals/model';
import { AppointmentModel } from '../appointments/model';
import { BusinessModel } from '../businesses/model';
import { AvailabilitySlot } from '@miturnouy/types';

// Helper to convert "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper to convert minutes from midnight to "HH:MM"
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Helper to check if two intervals overlap
function hasOverlap(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && e1 > s2;
}

export class AvailabilityService {
  /**
   * Calculates the available slots for a professional on a specific date for a given service.
   */
  static async getAvailableSlots(
    businessId: string,
    serviceId: string,
    professionalId: string,
    dateStr: string // YYYY-MM-DD
  ): Promise<AvailabilitySlot[]> {
    // 1. Fetch details
    const service = await ServiceModel.findOne({ _id: serviceId, businessId, active: true });
    if (!service) {
      throw new Error('Servicio no encontrado o inactivo');
    }

    // Determine Day of Week (0 = Sunday, 1 = Monday, etc.)
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // Check Service-Professional availability for this day
    const profConfig = service.professionalsConfig.find(
      (pc: any) => pc.professionalId.toString() === professionalId
    );
    if (profConfig && profConfig.availabilityDays && !profConfig.availabilityDays.includes(dayOfWeek)) {
      return [];
    }

    const professional = await ProfessionalModel.findOne({ _id: professionalId, businessId, active: true });
    if (!professional) {
      throw new Error('Profesional no encontrado o inactivo');
    }

    // Double check that the professional performs this service
    if (!professional.services.map((id: any) => id.toString()).includes(serviceId)) {
      return [];
    }

    const business = await BusinessModel.findOne({ _id: businessId, active: true });
    if (!business) {
      throw new Error('Negocio no encontrado');
    }

    // 2. Check Business Hours for that day
    const bizDayHours = business.settings.businessHours.days.find((d: any) => d.dayOfWeek === dayOfWeek);
    if (!bizDayHours || !bizDayHours.isOpen || bizDayHours.slots.length === 0) {
      return []; // Business is closed
    }

    // 3. Check Professional working hours for that day
    let openIntervals: Array<{ start: number; end: number }> = [];
    
    // Check if professional has a calendar exception for this date
    const exception = professional.exceptions?.find((e: any) => e.date === dateStr);
    
    if (exception) {
      if (!exception.isOpen) {
        return []; // Professional took the day off
      }
      openIntervals = exception.slots.map((s: any) => ({
        start: timeToMinutes(s.startTime),
        end: timeToMinutes(s.endTime),
      }));
    } else {
      // Use normal weekly schedule
      const profDayHours = professional.schedule.days.find((d: any) => d.dayOfWeek === dayOfWeek);
      if (!profDayHours || !profDayHours.isOpen || profDayHours.slots.length === 0) {
        return []; // Professional doesn't work this day of the week
      }
      openIntervals = profDayHours.slots.map((s: any) => ({
        start: timeToMinutes(s.startTime),
        end: timeToMinutes(s.endTime),
      }));
    }

    // Intersect professional intervals with business hours to ensure no professional works when business is closed
    const bizIntervals = bizDayHours.slots.map((s: any) => ({
      start: timeToMinutes(s.startTime),
      end: timeToMinutes(s.endTime),
    }));

    const activeWorkingIntervals: Array<{ start: number; end: number }> = [];
    for (const profInt of openIntervals) {
      for (const bizInt of bizIntervals) {
        const start = Math.max(profInt.start, bizInt.start);
        const end = Math.min(profInt.end, bizInt.end);
        if (start < end) {
          activeWorkingIntervals.push({ start, end });
        }
      }
    }

    if (activeWorkingIntervals.length === 0) {
      return [];
    }

    // 4. Fetch all active appointments for this professional on this date
    const appointments = await AppointmentModel.find({
      businessId,
      professionalId,
      date: dateStr,
      status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
    }).populate('serviceId');

    // Convert existing appointments into blocked intervals (including their service buffer times)
    const blockedIntervals = appointments.map(app => {
      const appStart = timeToMinutes(app.startTime);
      const appEnd = timeToMinutes(app.endTime);
      
      const appService = app.serviceId as any;
      const bufferBefore = appService?.bufferBefore || 0;
      const bufferAfter = appService?.bufferAfter || 0;
      
      // An appointment blocks the professional from [start - bufferBefore, end + bufferAfter]
      return {
        start: appStart - bufferBefore,
        end: appEnd + bufferAfter,
        rawStart: appStart,
        rawEnd: appEnd,
      };
    });

    // 5. Generate candidate slots
    const slots: AvailabilitySlot[] = [];
    const duration = service.duration;
    const bufferBefore = service.bufferBefore || 0;
    const bufferAfter = service.bufferAfter || 0;

    // We search the timeline at 15-minute grid increments
    const gridStep = 15;

    for (const interval of activeWorkingIntervals) {
      let candidateStart = interval.start;
      
      while (candidateStart + duration <= interval.end) {
        const candidateEnd = candidateStart + duration;
        
        // Define the proposed slot boundaries, including the buffers of the new service
        const proposedStartWithBuffer = candidateStart - bufferBefore;
        const proposedEndWithBuffer = candidateEnd + bufferAfter;

        // Check 1: Must fit entirely within the working hours interval
        const fitsInWorkingHours = candidateStart >= interval.start && candidateEnd <= interval.end;

        if (fitsInWorkingHours) {
          // Check 2: Check for collisions with existing appointments and their buffers
          let hasConflict = false;
          
          for (const blocked of blockedIntervals) {
            // Check overlaps between:
            // 1. Proposed service (with its buffer) and raw existing appointment
            // 2. Proposed service (raw) and existing appointment (with its buffer)
            const overlapWithNewBuffer = hasOverlap(
              proposedStartWithBuffer,
              proposedEndWithBuffer,
              blocked.rawStart,
              blocked.rawEnd
            );
            
            const overlapWithExistingBuffer = hasOverlap(
              candidateStart,
              candidateEnd,
              blocked.start,
              blocked.end
            );

            if (overlapWithNewBuffer || overlapWithExistingBuffer) {
              hasConflict = true;
              break;
            }
          }

          if (!hasConflict) {
            slots.push({
              startTime: minutesToTime(candidateStart),
              endTime: minutesToTime(candidateEnd),
            });
          }
        }

        candidateStart += gridStep;
      }
    }

    return slots;
  }
}

export default AvailabilityService;
