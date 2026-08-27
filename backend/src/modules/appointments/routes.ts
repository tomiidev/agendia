import { Router } from 'express';
import { AppointmentController } from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';

const router = Router();

// Publicly accessible to allow customer reservations
router.post('/', AppointmentController.create);

// Cron job route (should be secured by QStash middleware or similar, but for now added here)
router.post('/cron/update-noshows', AppointmentController.updatePastAppointmentsToNoShow);

// Authenticated private panel routes
router.get('/', requireAuth, requireTenant, AppointmentController.getAll);
router.get('/:id', requireAuth, requireTenant, AppointmentController.getById);
router.put('/:id', requireAuth, requireTenant, AppointmentController.update);
router.put('/:id/status', requireAuth, requireTenant, AppointmentController.updateStatus);

export default router;
