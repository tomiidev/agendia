import { Router } from 'express';
import { ClientController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { validate } from '../../middleware/validator';
import { clientSchema } from '../../shared/validation';

const router = Router();

// Secure all client routes
router.use(requireAuth);
router.use(requireTenant);

router.get('/', ClientController.getAll);
router.get('/:id', ClientController.getById);
router.post('/', validate(clientSchema), ClientController.create);
router.put('/:id', validate(clientSchema), ClientController.update);

export default router;
