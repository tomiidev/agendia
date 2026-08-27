import { Router } from 'express';
import { CouponController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { validate } from '../../middleware/validator';
import { couponSchema, baseCouponSchema } from '@miturnouy/validation';

const router = Router();

// Public: Validate coupon during booking flow
router.get('/validate/:code', CouponController.validateCoupon);

// Authenticated private panel routes
router.get('/', requireAuth, requireTenant, CouponController.getAll);
router.get('/:id', requireAuth, requireTenant, CouponController.getById);
router.post('/', requireAuth, requireTenant, validate(couponSchema), CouponController.create);
router.put('/:id', requireAuth, requireTenant, validate(baseCouponSchema.partial()), CouponController.update);
router.delete('/:id', requireAuth, requireTenant, CouponController.deactivate);

export default router;
