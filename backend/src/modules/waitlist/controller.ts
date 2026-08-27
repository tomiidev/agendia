import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { WaitlistModel } from './model';

export class WaitlistController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serviceId, professionalId, requestedDate, contactEmail, contactPhone } = req.body;
      const businessId = req.businessId || req.headers['x-business-id'];
      const clientId = req.clientId; // Assuming authentication sets this

      if (!businessId || !clientId || !serviceId || !professionalId || !requestedDate || !contactEmail) {
        return res.status(400).json({ success: false, message: 'Datos incompletos.' });
      }

      const entry = new WaitlistModel({
        businessId,
        clientId,
        serviceId,
        professionalId,
        requestedDate,
        contactEmail,
        contactPhone,
        status: 'PENDING',
      });

      await entry.save();

      return res.status(201).json({ success: true, message: 'Agregado a la lista de espera.', data: entry });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId;
      const entries = await WaitlistModel.find({ businessId, status: 'PENDING' })
        .populate('clientId')
        .populate('serviceId')
        .populate('professionalId')
        .sort({ createdAt: 1 });

      return res.status(200).json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entry = await WaitlistModel.findOneAndDelete({
        _id: req.params.id,
        businessId: req.businessId,
      });

      if (!entry) {
        return res.status(404).json({ success: false, message: 'Entrada no encontrada.' });
      }

      return res.status(200).json({ success: true, message: 'Eliminado de la lista de espera.' });
    } catch (error) {
      next(error);
    }
  }
}
export default WaitlistController;
