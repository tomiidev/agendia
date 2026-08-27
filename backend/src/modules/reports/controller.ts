import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { AppointmentModel } from '../appointments/model';
import { ClientModel } from '../clients/model';
import { ProfessionalModel } from '../professionals/model';
import { ServiceModel } from '../services/model';

export class ReportsController {
  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId;
      const range = (req.query.range as string) || '30d';

      // Calculate start date
      const startDate = new Date();
      if (range === '30d') startDate.setDate(startDate.getDate() - 30);
      else if (range === '3m') startDate.setMonth(startDate.getMonth() - 3);
      else if (range === '6m') startDate.setMonth(startDate.getMonth() - 6);
      else if (range === '1y') startDate.setFullYear(startDate.getFullYear() - 1);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Get Today's date in YYYY-MM-DD
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // 1. Basic aggregates
      const [appointments, todayAppointments] = await Promise.all([
        AppointmentModel.find({ 
            businessId,
            date: { $gte: startDateStr }
        }).populate('serviceId professionalId clientId'),
        AppointmentModel.find({
            businessId,
            date: todayStr
        })
      ]);
      
      const totalClientsCount = await ClientModel.countDocuments({ businessId });

      // Today's Summary
      const todaySummary = {
        total: todayAppointments.length,
        confirmed: todayAppointments.filter((a: any) => a.status === 'CONFIRMED').length,
        pending: todayAppointments.filter((a: any) => a.status === 'PENDING').length,
        cancelled: todayAppointments.filter((a: any) => a.status === 'CANCELLED').length,
        noShow: todayAppointments.filter((a: any) => a.status === 'NO_SHOW').length,
      };

      // Occupancy Rate (Today)
      // Assuming 8 hours workday = 480 minutes
      const totalMinutesAvailable = 480; 
      const bookedMinutes = todayAppointments
        .filter((a: any) => a.status !== 'CANCELLED')
        .reduce((sum: number, a: any) => sum + (a.serviceId?.duration || 30), 0);
      const occupancyRate = Math.min(100, Math.round((bookedMinutes / totalMinutesAvailable) * 100));

      // 2. Client Retention
      // ... (rest of logic)
      const clientAppointmentCounts = appointments.reduce((acc: any, app: any) => {
        if (app.clientId) {
            acc[app.clientId.id] = (acc[app.clientId.id] || 0) + 1;
        }
        return acc;
      }, {});
      
      const returningClients = Object.values(clientAppointmentCounts).filter((c: any) => c > 1).length;
      const newClients = Object.values(clientAppointmentCounts).filter((c: any) => c === 1).length;

      // 3. Professional Performance
      const profPerformance = appointments.reduce((acc: any, app: any) => {
        if (app.professionalId && app.status === 'COMPLETED') {
            const id = app.professionalId.id;
            if (!acc[id]) acc[id] = { name: app.professionalId.name, revenue: 0, count: 0 };
            acc[id].revenue += app.finalPrice || 0;
            acc[id].count += 1;
        }
        return acc;
      }, {});

      // 4. Cancellation/No-Show breakdown
      const cancellationReasons = appointments.reduce((acc: any, app: any) => {
        if (app.status === 'CANCELLED' && app.statusHistory?.length > 0) {
            const lastHistory = app.statusHistory[app.statusHistory.length - 1];
            const reason = lastHistory.comment || 'Sin motivo';
            acc[reason] = (acc[reason] || 0) + 1;
        }
        return acc;
      }, {});

      // 5. Coupon Impact
      const couponImpact = appointments.reduce((acc: any, app: any) => {
        if (app.couponId) {
            acc.totalUsed += 1;
            acc.totalDiscounted += app.discountAmount || 0;
        }
        return acc;
      }, { totalUsed: 0, totalDiscounted: 0 });

      return res.status(200).json({
        success: true,
        data: {
          todaySummary: {
            ...todaySummary,
            occupancyRate,
          },
          metrics: {
            totalClients: totalClientsCount,
            returningClients,
            newClients,
            retentionRate: totalClientsCount > 0 ? Math.round((returningClients / totalClientsCount) * 100) : 0,
            monthlyRevenue: appointments.filter((a:any) => a.status === 'COMPLETED').reduce((sum: number, a:any) => sum + (a.finalPrice || 0), 0),
            cancelRate: appointments.length > 0 ? Math.round((appointments.filter((a:any) => a.status === 'CANCELLED').length / appointments.length) * 100) : 0,
          },
          professionalPerformance: Object.values(profPerformance),
          cancellationReasons,
          couponImpact,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
export default ReportsController;
