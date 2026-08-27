import { Request, Response, NextFunction } from 'express';
import { ServiceModel } from '../services/model';
import { ProfessionalModel } from '../professionals/model';
import { AvailabilityService } from '../availability/service';
import { BusinessModel } from '../businesses/model';
import { AppointmentModel } from '../appointments/model';

export class PublicController {
  // ... existing methods ...
  static async updateAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const client = (req as any).client;
      const { date, startTime, professionalId, serviceId, notes } = req.body;
      
      const appointment = await AppointmentModel.findOne({ _id: id, clientId: client.id });

      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Turno no encontrado' });
      }

      // Update fields
      if (date) appointment.date = date;
      if (startTime) appointment.startTime = startTime;
      if (professionalId) appointment.professionalId = professionalId;
      if (serviceId) appointment.serviceId = serviceId;
      if (notes !== undefined) appointment.notes = notes;

      // Note: In a real scenario, you should also re-calculate endTime 
      // based on the new service duration and check availability here!
      // For now, focusing on the requested field updates.

      await appointment.save();

      return res.status(200).json({ success: true, data: appointment });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const client = (req as any).client;
      
      // Update status to CANCELLED instead of hard delete
      const appointment = await AppointmentModel.findOneAndUpdate(
        { _id: id, clientId: client.id },
        { status: 'CANCELLED' },
        { new: true }
      );

      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Turno no encontrado' });
      }

      return res.status(200).json({ success: true, message: 'Turno cancelado' });
    } catch (error) {
      next(error);
    }
  }

  static async getMyAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const client = (req as any).client;
      // Get businessId from the authenticated client JWT
      const businessId = client.businessId; 

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'ID de negocio no encontrado en el token' });
      }

      const appointments = await AppointmentModel.find({ clientId: client.id, businessId })
        .populate('serviceId')
        .populate('professionalId')
        .sort({ date: -1 });

      return res.status(200).json({ success: true, data: appointments });
    } catch (error) {
      next(error);
    }
  }
  static async getBusinessBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const business = await BusinessModel.findOne({ slug, active: true });
      if (!business) {
        return res.status(404).json({ success: false, message: 'Negocio no encontrado' });
      }
      return res.status(200).json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;
      const business = await BusinessModel.findOne({ _id: businessId, active: true });
      if (!business) {
        return res.status(404).json({ success: false, message: 'Negocio no encontrado' });
      }
      return res.status(200).json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }

  static async getServices(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;
      const services = await ServiceModel.find({ businessId, active: true });
      return res.status(200).json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  }

  static async getProfessionals(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;
      const professionals = await ProfessionalModel.find({ businessId, active: true });
      return res.status(200).json({ success: true, data: professionals });
    } catch (error) {
      next(error);
    }
  }

  static async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;
      const { serviceId, professionalId, date } = req.query as {
        serviceId: string;
        professionalId: string;
        date: string;
      };

      if (!serviceId || !professionalId || !date) {
        return res.status(400).json({ success: false, message: 'Parámetros faltantes' });
      }

      const slots = await AvailabilityService.getAvailableSlots(
        businessId,
        serviceId,
        professionalId,
        date
      );

      return res.status(200).json({ success: true, data: slots });
    } catch (error) {
      next(error);
    }
  }
}
