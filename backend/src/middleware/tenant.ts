import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { MembershipModel } from '../modules/memberships/model';

export async function requireTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Inicie sesión primero.',
    });
  }

  const headerBusinessId = req.headers['x-business-id'] as string;

  try {
    let activeMembership = null;

    if (headerBusinessId) {
      // User requested a specific tenant, check if they have membership
      activeMembership = await MembershipModel.findOne({
        userId: req.user.id,
        businessId: headerBusinessId,
        active: true,
      });

      if (!activeMembership) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a este negocio o el ID no es válido.',
        });
      }
    } else {
      // Try to find any active membership for this user to default to
      activeMembership = await MembershipModel.findOne({
        userId: req.user.id,
        active: true,
      });

      if (!activeMembership) {
        // If they have no memberships, we let it slide *only* if they are onboarding (creating a business)
        // Check if the path is POST /api/v1/businesses
        if (req.path === '/businesses' && req.method === 'POST') {
          return next();
        }
        
        return res.status(403).json({
          success: false,
          message: 'Debes pertenecer a un negocio o completar el onboarding.',
          onboardingRequired: true,
        });
      }
    }

    // Attach verified tenant properties to Request object
    req.businessId = activeMembership.businessId.toString();
    req.role = activeMembership.role;

    next();
  } catch (error) {
    console.error('Error resolving tenant:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar los permisos del negocio.',
    });
  }
}

export default requireTenant;
