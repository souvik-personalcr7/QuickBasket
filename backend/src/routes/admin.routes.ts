import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getActiveDeliveries } from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/deliveries/active', getActiveDeliveries);

export const adminRoutes = router;

