import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { AvailabilityService } from './service';

export class AvailabilityController {
  static async getSlots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serviceId, professionalId, date } = req.query as {
        serviceId: string;
        professionalId: string;
        date: string;
      };

      if (!serviceId || !professionalId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Faltan parámetros requeridos: serviceId, professionalId, date.',
        });
      }

      // Check date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Debe ser YYYY-MM-DD.',
        });
      }

      // Use req.businessId if logged in/dashboard context, or look for a fallback header/slug for public bookings.
      // For public booking, they might pass a header X-Business-ID or a query param businessId.
      const businessId = req.businessId || (req.headers['x-business-id'] as string) || (req.query.businessId as string);

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: 'businessId es requerido para calcular disponibilidad.',
        });
      }

      const slots = await AvailabilityService.getAvailableSlots(
        businessId,
        serviceId,
        professionalId,
        date
      );

      return res.status(200).json({
        success: true,
        data: slots,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default AvailabilityController;
