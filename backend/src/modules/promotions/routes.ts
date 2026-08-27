import { Router } from 'express';
import { PromotionController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { validate } from '../../middleware/validator';
import { promotionSchema } from '@miturnouy/validation';

const router = Router();

// Secure all promotion endpoints
router.use(requireAuth);
router.use(requireTenant);

router.get('/', PromotionController.getAll);
router.get('/:id', PromotionController.getById);
router.post('/', validate(promotionSchema), PromotionController.create);
router.put('/:id', validate(promotionSchema.partial()), PromotionController.update);
router.delete('/:id', PromotionController.deactivate);

export default router;
