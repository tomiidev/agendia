import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/express';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Prefer cookies for security (HttpOnly), fallback to Authorization header
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Por favor, inicia sesión para continuar.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sesión vencida o inválida. Por favor, inicia sesión nuevamente.',
    });
  }
}

export default requireAuth;
