import { Router } from 'express';
import { ProfessionalController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { validate } from '../../middleware/validator';
import { professionalSchema } from '@miturnouy/validation';

const router = Router();

// Secure all professional endpoints to authenticated business members
router.use(requireAuth);
router.use(requireTenant);

router.get('/', ProfessionalController.getAll);
router.get('/:id', ProfessionalController.getById);
router.post('/', validate(professionalSchema), ProfessionalController.create);
router.put('/:id', validate(professionalSchema), ProfessionalController.update);
router.delete('/:id', ProfessionalController.delete);

export default router;
