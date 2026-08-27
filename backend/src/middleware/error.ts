import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  isOperational?: boolean;
  error?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Always log the actual stack trace internally for debugging
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  const statusCode = err.status || 500;
  
  // Custom message mapping to keep error responses user-friendly
  let friendlyMessage = 'Ha ocurrido un error inesperado en el servidor. Por favor, intenta de nuevo.';
  
  if (err.isOperational) {
    friendlyMessage = err.message;
  } else if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Datos enviados inválidos',
      error: err.message,
    });
  } else if (err.name === 'MongoServerError' || err.name === 'MongooseError') {
    // Database specific abstraction
    return res.status(400).json({
      success: false,
      message: 'Error al procesar la solicitud en la base de datos.',
    });
  } else if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Sesión inválida o expirada. Por favor, inicia sesión de nuevo.',
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: friendlyMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
export default errorHandler;
