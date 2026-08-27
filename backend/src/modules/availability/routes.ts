import { Router } from 'express';
import { AvailabilityController } from './controller';

const router = Router();

// Availability route is public so that both the business panel and the public booking page can check slots.
router.get('/', AvailabilityController.getSlots);

export default router;
