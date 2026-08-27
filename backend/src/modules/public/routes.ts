import { Router } from 'express';
import { PublicController } from './controller';
import { requireClientAuth } from '../../middleware/clientAuth';
import { QuoteRequestController } from '../quote-requests/controller';
import { validate } from '../../middleware/validator';
import { quoteRequestSchema } from '../../shared/validation';
const router = Router({ mergeParams: true }); // Merge params to access :businessId

// Existing routes requiring businessId parameter
router.get('/info', PublicController.getBusinessInfo);
router.get('/services', PublicController.getServices);
router.get('/professionals', PublicController.getProfessionals);
router.get('/availability', PublicController.getAvailability);
router.post('/quote-requests', validate(quoteRequestSchema), QuoteRequestController.createPublic);

// New route without businessId parameter
const standaloneRouter = Router();
standaloneRouter.get('/my-appointments', requireClientAuth, PublicController.getMyAppointments);

export default router; // This keeps existing structure
// I need to find where to mount standaloneRouter or update the app.ts to support this.

