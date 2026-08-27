import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { QuoteRequestModel } from './model';
import { ServiceModel } from '../services/model';
import { ClientModel } from '../clients/model';

export class QuoteRequestController {
  // Public Endpoint to submit a quote request
  static async createPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;
      const { serviceId, name, email, phone, description } = req.body;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'ID de negocio es requerido.' });
      }

      // Check if service exists, belongs to business, and is active
      const service = await ServiceModel.findOne({ _id: serviceId, businessId, active: true });
      if (!service) {
        return res.status(404).json({ success: false, message: 'El servicio solicitado no existe o no está activo.' });
      }

      // Check bookingMode validation
      if (service.bookingMode === 'DIRECT') {
        return res.status(400).json({
          success: false,
          message: 'Este servicio solo admite reservas directas, no solicitudes de presupuesto.',
        });
      }

      // Resolve client profile: search by phone in this business, create if not exists
      let client = await ClientModel.findOne({ businessId, phone: phone.trim() });
      if (!client) {
        client = new ClientModel({
          businessId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        });
        await client.save();
      }

      // Create new quote request
      const quoteRequest = new QuoteRequestModel({
        businessId,
        serviceId,
        clientId: client._id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        description: description.trim(),
        status: 'PENDING',
      });

      await quoteRequest.save();

      return res.status(201).json({
        success: true,
        message: 'Solicitud de presupuesto registrada con éxito.',
        data: quoteRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  // Dashboard endpoint: get all quote requests for the business
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId;
      const { status, page = '1', limit = '10' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const query: any = { businessId };
      if (status && ['PENDING', 'CONTACTED', 'CLOSED'].includes(status as string)) {
        query.status = status;
      }

      const total = await QuoteRequestModel.countDocuments(query);
      const quoteRequests = await QuoteRequestModel.find(query)
        .populate('serviceId')
        .populate('clientId')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      return res.status(200).json({
        success: true,
        data: quoteRequests,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Dashboard endpoint: update status of a quote request
  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId;
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['PENDING', 'CONTACTED', 'CLOSED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado inválido o faltante.' });
      }

      const quoteRequest = await QuoteRequestModel.findOneAndUpdate(
        { _id: id, businessId },
        { $set: { status } },
        { new: true }
      ).populate('serviceId').populate('clientId');

      if (!quoteRequest) {
        return res.status(404).json({ success: false, message: 'Solicitud de presupuesto no encontrada.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Estado actualizado correctamente.',
        data: quoteRequest,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default QuoteRequestController;
