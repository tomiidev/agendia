import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { BusinessModel } from './model';
import { ServiceModel } from '../services/model';
import { ProfessionalModel } from '../professionals/model';

export class BusinessController {
  // Public route to fetch business metadata by web slug
  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const business = await BusinessModel.findOne({ slug: slug.toLowerCase(), active: true });
      
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Negocio no encontrado o inactivo.',
        });
      }

      // Fetch active services and professionals associated with this business for the booking wizard
      const [services, professionals] = await Promise.all([
        ServiceModel.find({ businessId: business.id, active: true }),
        ProfessionalModel.find({ businessId: business.id, active: true }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          business,
          services,
          professionals: professionals.map(p => ({
            id: p.id,
            name: p.name,
            photoUrl: p.photoUrl,
            description: p.description,
            specialties: p.specialties,
            services: p.services,
            calendarColor: p.calendarColor,
            schedule: p.schedule,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Fetch logged-in user's active tenant
  static async getMyBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.businessId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant no especificado.',
        });
      }

      const business = await BusinessModel.findById(req.businessId);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Negocio no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update business configuration settings or metadata
  static async updateMyBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.businessId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant no especificado.',
        });
      }

      // Restrict critical updates to OWNER or ADMIN role
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado. No eres administrador de este negocio.',
        });
      }

      const updated = await BusinessModel.findByIdAndUpdate(
        req.businessId,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Negocio no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Configuración de negocio actualizada con éxito.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create Business (Onboarding route)
  static async createBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, slug, type, settings } = req.body;
      
      const existingSlug = await BusinessModel.findOne({ slug: slug.toLowerCase() });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: 'El slug ya está en uso.',
        });
      }

      const business = new BusinessModel({
        name,
        slug: slug.toLowerCase(),
        type,
        settings,
        active: true,
      });

      await business.save();
      
      return res.status(201).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default BusinessController;
