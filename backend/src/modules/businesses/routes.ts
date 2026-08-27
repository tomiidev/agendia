import { Router } from 'express';
import { BusinessController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { validate } from '../../middleware/validator';
import { businessSchema } from '../../shared/validation';

const router = Router();

// Public: Get business profile by URL slug
router.get('/slug/:slug', BusinessController.getBySlug);

// Private: Requires auth and resolving active membership
router.get('/my', requireAuth, requireTenant, BusinessController.getMyBusiness);
router.put('/my', requireAuth, requireTenant, validate(businessSchema), BusinessController.updateMyBusiness);

// Onboarding: Create new business
router.post('/', requireAuth, validate(businessSchema), BusinessController.createBusiness);

export default router;
