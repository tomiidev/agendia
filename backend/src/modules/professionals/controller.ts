import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { ProfessionalModel } from './model';
import { connectDB } from '../../config/db';

export class ProfessionalController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    await connectDB();
    try {
      const professionals = await ProfessionalModel.find({
        businessId: req.businessId,
        active: true,
      });

      return res.status(200).json({
        success: true,
        data: professionals,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    await connectDB();
    try {
      const professional = await ProfessionalModel.findOne({
        _id: req.params.id,
        businessId: req.businessId,
        active: true,
      });

      if (!professional) {
        return res.status(404).json({
          success: false,
          message: 'Profesional no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        data: professional,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    await connectDB();
    try {
      // Validate roles
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado.',
        });
      }

      const professional = new ProfessionalModel({
        ...req.body,
        businessId: req.businessId,
        active: true,
      });

      await professional.save();

      return res.status(201).json({
        success: true,
        message: 'Profesional creado con éxito.',
        data: professional,
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

      const updated = await ProfessionalModel.findOneAndUpdate(
        { _id: req.params.id, businessId: req.businessId },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Profesional no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profesional actualizado con éxito.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    await connectDB();
    try {
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado.',
        });
      }

      // Soft delete: set active = false
      const deleted = await ProfessionalModel.findOneAndUpdate(
        { _id: req.params.id, businessId: req.businessId },
        { $set: { active: false } },
        { new: true }
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Profesional no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profesional desactivado con éxito.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ProfessionalController;
