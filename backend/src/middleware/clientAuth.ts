import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345!@#';

export const requireClientAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).client = decoded; // Attach client info to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};
