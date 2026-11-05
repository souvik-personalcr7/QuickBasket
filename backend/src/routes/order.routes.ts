import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { createOrder, getOrders, getOrderById } from '../controllers/order.controller';

const router = Router();

router.use(authenticate);

// Only customers (and admins) can place customer orders
router.post('/', authorize('customer', 'admin'), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export const orderRoutes = router;

