import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { CouponModel } from './model';

export class CouponController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query = {
        businessId: req.businessId,
      };

      const [coupons, total] = await Promise.all([
        CouponModel.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        CouponModel.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data: coupons,
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
      const coupon = await CouponModel.findOne({
        _id: req.params.id,
        businessId: req.businessId,
      });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Cupón no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        data: coupon,
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

      if (req.body.code) {
        const uppercaseCode = req.body.code.trim().toUpperCase();
        const existing = await CouponModel.findOne({
          businessId: req.businessId,
          code: uppercaseCode,
          active: true,
          _id: { $ne: req.params.id },
        });

        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un cupón activo con ese código.',
          });
        }
        req.body.code = uppercaseCode;
      }

      const updated = await CouponModel.findOneAndUpdate(
        { _id: req.params.id, businessId: req.businessId },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Cupón no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cupón actualizado con éxito.',
        data: updated,
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

      const { code } = req.body;
      const uppercaseCode = code.trim().toUpperCase();

      const existing = await CouponModel.findOne({
        businessId: req.businessId,
        code: uppercaseCode,
        active: true,
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cupón activo con ese código.',
        });
      }

      const coupon = new CouponModel({
        ...req.body,
        code: uppercaseCode,
        businessId: req.businessId,
        active: true,
      });

      await coupon.save();

      return res.status(201).json({
        success: true,
        message: 'Cupón creado con éxito.',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  // Public/Private endpoint to check if code is valid
  static async validateCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { serviceId, basePrice } = req.query as { serviceId?: string; basePrice?: string };

      const businessId = req.businessId || (req.headers['x-business-id'] as string) || (req.query.businessId as string);

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: 'businessId es requerido para validar el cupón.',
        });
      }

      const coupon = await CouponModel.findOne({
        businessId,
        code: code.trim().toUpperCase(),
        active: true,
      });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Cupón no encontrado o inactivo.',
        });
      }

      // Check date bounds
      const nowStr = new Date().toISOString().split('T')[0];
      if (nowStr < coupon.startDate || nowStr > coupon.endDate) {
        return res.status(400).json({
          success: false,
          message: 'El cupón ha vencido o todavía no está activo.',
        });
      }

      // Check max usage
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({
          success: false,
          message: 'El cupón ya ha alcanzado el límite de usos.',
        });
      }

      // Check purchase price limit
      if (basePrice && coupon.minPurchaseAmount && Number(basePrice) < coupon.minPurchaseAmount) {
        return res.status(400).json({
          success: false,
          message: `La compra debe ser de al menos $${coupon.minPurchaseAmount} para aplicar este cupón.`,
        });
      }

      // Check service exceptions
      if (serviceId && coupon.specificServices && coupon.specificServices.length > 0) {
        const isAllowed = coupon.specificServices.map((id: any) => id.toString()).includes(serviceId);
        if (!isAllowed) {
          return res.status(400).json({
            success: false,
            message: 'Este cupón no es válido para el servicio seleccionado.',
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Cupón válido.',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.role !== 'OWNER' && req.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado.',
        });
      }

      const coupon = await CouponModel.findOneAndUpdate(
        { _id: req.params.id, businessId: req.businessId },
        { $set: { active: false } },
        { new: true }
      );

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Cupón no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cupón desactivado con éxito.',
      });
    } catch (error) {
      next(error);
    }
  }
}
export default CouponController;
