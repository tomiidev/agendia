import { Router } from 'express';
import { PublicController } from './controller';

const router = Router();

router.get('/:slug', PublicController.getBusinessBySlug);

export default router;
