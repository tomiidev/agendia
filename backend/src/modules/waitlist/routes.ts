import { Router } from 'express';
import { WaitlistController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';

const router = Router();

// Routes
router.post('/', requireAuth, WaitlistController.create);
router.get('/', requireAuth, requireTenant, WaitlistController.getAll);
router.delete('/:id', requireAuth, requireTenant, WaitlistController.delete);

export default router;
