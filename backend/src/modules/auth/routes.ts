import { Router } from 'express';
import { AuthController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { loginSchema, registerSchema } from '@miturnouy/validation';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/logout', AuthController.logout);
router.post('/public/request-otp', AuthController.requestPublicOtp);
router.post('/public/verify-otp', AuthController.verifyPublicOtp);
router.get('/me', requireAuth, AuthController.me);

export default router;
