import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { ClientModel } from './model';
import { AppointmentModel } from '../appointments/model';
import mongoose from 'mongoose';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Computes CRM stats (appointmentCount, totalSpent, lastVisit) for a single
 * client from a pre-fetched history array so we avoid extra DB round-trips.
 */
function computeClientStats(history: any[]) {
  const appointmentCount = history.length;
  const totalSpent = history
    .filter((a) => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + (a.finalPrice || 0), 0);
  const completedDates = history
    .filter((a) => a.status === 'COMPLETED')
    .map((a) => a.date)
    .filter(Boolean);
  const lastVisit =
    completedDates.length > 0 ? completedDates.sort().reverse()[0] : null;
  return { appointmentCount, totalSpent, lastVisit };
}

// ─── Controller ───────────────────────────────────────────────────────────────

export class ClientController {
  // ── GET /clients ────────────────────────────────────────────────────────────
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query = { businessId: req.businessId };

      const [clients, total] = await Promise.all([
        ClientModel.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        ClientModel.countDocuments(query),
      ]);

      // Aggregation to compute metrics per client for the CRM grid
      // Only for the current page
      const clientIds = clients.map((c) => c._id);
      const appointmentsAggregation = await AppointmentModel.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(req.businessId),
            clientId: { $in: clientIds },
          },
        },
        {
          $group: {
            _id: '$clientId',
            appointmentCount: { $sum: 1 },
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$finalPrice', 0],
              },
            },
            lastVisit: {
              $max: {
                $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$date', null],
              },
            },
          },
        },
      ]);

      const statsMap = new Map(
        appointmentsAggregation.map((item) => [item._id.toString(), item])
      );

      const clientsWithStats = clients.map((client) => {
        const statObj = statsMap.get(client.id);
        return {
          ...client.toJSON(),
          appointmentCount: statObj?.appointmentCount || 0,
          totalSpent: statObj?.totalSpent || 0,
          lastVisit: statObj?.lastVisit || null,
        };
      });

      return res.status(200).json({
        success: true,
        data: clientsWithStats,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ── GET /clients/:id ─────────────────────────────────────────────────────────
  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const client = await ClientModel.findOne({
        _id: req.params.id,
        businessId: req.businessId,
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado.',
        });
      }

      // Full appointment history with populated relations (professional & service)
      const history = await AppointmentModel.find({
        businessId: req.businessId,
        clientId: client.id,
      })
        .populate('professionalId')
        .populate('serviceId')
        .sort({ date: -1, startTime: -1 });

      // Compute CRM stats from history in-process (no extra aggregation needed)
      const stats = computeClientStats(history.map((h) => h.toJSON()));

      return res.status(200).json({
        success: true,
        data: {
          client: {
            ...client.toJSON(),
            ...stats,
          },
          history,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ── POST /clients ─────────────────────────────────────────────────────────────
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, phone, email, notes, tags } = req.body;

      // Prevent duplicates by phone within the same business
      const existingClient = await ClientModel.findOne({
        businessId: req.businessId,
        phone: phone.trim(),
      });

      if (existingClient) {
        return res.status(200).json({
          success: true,
          message: 'El cliente ya estaba registrado.',
          data: existingClient,
        });
      }

      const client = new ClientModel({
        businessId: req.businessId,
        name,
        phone,
        email,
        notes,
        tags,
      });

      await client.save();

      return res.status(201).json({
        success: true,
        message: 'Cliente creado con éxito.',
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── PUT /clients/:id ──────────────────────────────────────────────────────────
  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Whitelist updatable fields — prevents businessId / _id overrides
      const { name, phone, email, notes, tags } = req.body;
      const allowedUpdate = { name, phone, email, notes, tags };

      const updated = await ClientModel.findOneAndUpdate(
        { _id: req.params.id, businessId: req.businessId },
        { $set: allowedUpdate },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado.',
        });
      }

      // Return the same enriched shape as getById so the drawer can update in-place
      const history = await AppointmentModel.find({
        businessId: req.businessId,
        clientId: updated.id,
      })
        .populate('professionalId')
        .populate('serviceId')
        .sort({ date: -1, startTime: -1 });

      const stats = computeClientStats(history.map((h) => h.toJSON()));

      return res.status(200).json({
        success: true,
        message: 'Cliente actualizado con éxito.',
        data: {
          client: {
            ...updated.toJSON(),
            ...stats,
          },
          history,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
export default ClientController;
