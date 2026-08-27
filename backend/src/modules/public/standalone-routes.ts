import { Router } from 'express';
import { PublicController } from './controller';
import { requireClientAuth } from '../../middleware/clientAuth';

const router = Router();

router.get('/my-appointments', requireClientAuth, PublicController.getMyAppointments);
router.put('/appointments/:id', requireClientAuth, PublicController.updateAppointment);
router.delete('/appointments/:id', requireClientAuth, PublicController.deleteAppointment);

export default router;
