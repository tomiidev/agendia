import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { ServiceModel } from './model';

export class ServiceController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string; // 'active', 'inactive', 'all'
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      const query: any = {
        businessId: req.businessId,
      };

      if (status && status !== 'all') {
        query.active = status === 'active';
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const [services, total] = await Promise.all([
        ServiceModel.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        ServiceModel.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data: services,
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
    try {
      const service = await ServiceModel.findOne({
        _id: req.params.id,
        businessId: req.businessId,
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado.',
        });
      }

      if (!req.body.professionalsConfig || req.body.professionalsConfig.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes asignar al menos un profesional.',
        });
      }

      const service = new ServiceModel({
        ...req.body,
        businessId: req.businessId,
        active: true,
      });

      await service.save();

      return res.status(201).json({
        success: true,
        message: 'Servicio creado con éxito.',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado.',
        });
      }

      const { name, description, category, price, duration, bufferBefore, bufferAfter, professionalsConfig, active, bookingMode } = req.body;
      
      if (professionalsConfig && professionalsConfig.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes asignar al menos un profesional.',
        });
      }
      
      const updateData: any = {
        name,
        description,
        category,
        price,
        duration,
        bufferBefore,
        bufferAfter,
        professionalsConfig,
        bookingMode,
      };
      
      if (active !== undefined) updateData.active = active;

      const updated = await ServiceModel.findOneAndUpdate(
        { _id: req.params.id, businessId: req.businessId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Servicio actualizado con éxito.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado.',
        });
      }

      // Soft delete: set active = false
      const deleted = await ServiceModel.findOneAndUpdate(
        { _id: req.params.id, businessId: req.businessId },
        { $set: { active: false } },
        { new: true }
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Servicio desactivado con éxito.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ServiceController;
