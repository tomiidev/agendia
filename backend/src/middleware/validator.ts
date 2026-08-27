import { Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AuthenticatedRequest } from '../types/express';

export const validate = (schema: ZodSchema) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación inválidos',
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    
    req.body = result.data;
    next();
  };
};

export default validate;
