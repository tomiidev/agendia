import { Router } from 'express';
import { ReportsController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';

const router = Router();

// Secure all report analysis endpoints
router.use(requireAuth);
router.use(requireTenant);

router.get('/stats', ReportsController.getStats);

export default router;
