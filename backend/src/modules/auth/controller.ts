import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      // Set cookie options
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Credenciales inválidas',
      });
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);

      // Set cookie options
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error en el registro',
      });
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    res.clearCookie('token');
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada con éxito.',
    });
  }

  static async requestPublicOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const client = await AuthService.requestPublicOtp(email);
      return res.status(200).json({ success: true, message: 'Código enviado.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async verifyPublicOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      const result = await AuthService.verifyPublicOtp(email, code);
      
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }

  static async me(req: any, res: Response, next: NextFunction) {
    // If auth middleware passed, req.user has user info
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }
}
export default AuthController;
