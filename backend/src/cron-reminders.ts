
import { NotificationService } from './utils/notifications';
import { connectDB } from './config/db';
import AppointmentModel from './modules/appointments/model';

/**
 * Script to be run by a cron job
 * Finds all upcoming confirmed appointments and sends reminders.
 */
export async function sendReminders() {
  await connectDB();
  
  // Get current date to filter past appointments
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  console.log(`[Cron] Checking for all upcoming confirmed appointments`);

  // Find confirmed appointments for today or later
  const appointments = await AppointmentModel.find({
    date: { $gte: todayStr },
    status: 'CONFIRMED',
    reminderSent: { $ne: true } // Only those not yet sent
  })
    .populate('clientId')
    .populate('serviceId')
    .populate('businessId');

  console.log(`[Cron] Found ${appointments.length} appointments to remind.`);

  for (const appointment of appointments as any) {
    const client = appointment.clientId;
    const business = appointment.businessId;
    const service = appointment.serviceId;

    if (client && client.email) {
      await NotificationService.sendAppointmentReminder(appointment, client, service, business);

      // Mark as sent
      appointment.reminderSent = true;
      await appointment.save();
      console.log(`[Cron] Reminder sent to ${client.email} for appointment ${appointment._id}`);
    }
  }
}

