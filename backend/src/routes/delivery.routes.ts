import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getDeliveryActiveOrders,
  acceptDeliveryOrder,
  updateDeliveryStatus,
  updateRiderGpsLocation,
} from '../controllers/delivery.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('delivery_partner', 'admin'));

router.get('/active-orders', getDeliveryActiveOrders);
router.post('/orders/:id/accept', acceptDeliveryOrder);
router.post('/orders/:id/status', updateDeliveryStatus);
router.post('/orders/:id/location', updateRiderGpsLocation);

export const deliveryRoutes = router;

