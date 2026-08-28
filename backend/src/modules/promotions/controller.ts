import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { PromotionModel } from './model';
import { connectDB } from '../../config/db';

export class PromotionController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    await connectDB();
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query = {
        businessId: req.businessId,
      };

      const [promotions, total] = await Promise.all([
        PromotionModel.find(query)
          .skip(skip)
          .limit(limit)
          .populate('serviceId')
          .sort({ createdAt: -1 }),
        PromotionModel.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data: promotions,
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

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    await connectDB();
    try {
      const promotion = await PromotionModel.findOne({
        _id: req.params.id,
        businessId: req.businessId,
      }).populate('serviceId');

      if (!promotion) {
        return res.status(404).json({
          success: false,
          message: 'Promoción no encontrada.',
        });
      }

      return res.status(200).json({
        success: true,
        data: promotion,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    await connectDB();
    try {
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado.',
        });
      }

      const updated = await PromotionModel.findOneAndUpdate(
        { _id: req.params.id, businessId: req.businessId },
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('serviceId');

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Promoción no encontrada.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Promoción actualizada con éxito.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    await connectDB();
    try {
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado.',
        });
      }

      const promotion = new PromotionModel({
        ...req.body,
        businessId: req.businessId,
        active: true,
      });

      await promotion.save();

      return res.status(201).json({
        success: true,
        message: 'Promoción creada con éxito.',
        data: promotion,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    await connectDB();
    try {
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado.',
        });
      }

      const promotion = await PromotionModel.findOneAndUpdate(
        { _id: req.params.id, businessId: req.businessId },
        { $set: { active: false } },
        { new: true }
      );

      if (!promotion) {
        return res.status(404).json({
          success: false,
          message: 'Promoción no encontrada.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Promoción desactivada con éxito.',
      });
    } catch (error) {
      next(error);
    }
  }
}
export default PromotionController;
