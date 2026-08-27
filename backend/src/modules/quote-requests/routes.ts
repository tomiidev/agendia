import { Router } from 'express';
import { QuoteRequestController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', QuoteRequestController.getAll);
router.put('/:id/status', QuoteRequestController.updateStatus);

export default router;
