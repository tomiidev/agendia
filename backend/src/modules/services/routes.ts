import { Router } from 'express';
import { ServiceController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { validate } from '../../middleware/validator';
import { serviceSchema } from '../../shared/validation';

const router = Router();

// Secure all service management routes
router.use(requireAuth);
router.use(requireTenant);

router.get('/', ServiceController.getAll);
router.get('/:id', ServiceController.getById);
router.post('/', validate(serviceSchema), ServiceController.create);
router.put('/:id', validate(serviceSchema.partial()), ServiceController.update);
router.delete('/:id', ServiceController.delete);

export default router;
