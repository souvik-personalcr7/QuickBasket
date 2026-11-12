import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { addressRoutes } from './address.routes';
import { orderRoutes } from './order.routes';
import { deliveryRoutes } from './delivery.routes';
import { adminRoutes } from './admin.routes';
import { productRoutes } from './product.routes';
import { shopRoutes } from './shop.routes';

const router = Router();

// Mount Health Check
router.use('/health', healthRoutes);

// Mount Auth Routes (Role-based Sign up, Login, Profile, Logout)
router.use('/auth', authRoutes);

// Mount Address Management Routes
router.use('/addresses', addressRoutes);

// Mount Order Management Routes
router.use('/orders', orderRoutes);

// Mount Delivery Partner Routes
router.use('/delivery', deliveryRoutes);

// Mount Product Management Routes
router.use('/products', productRoutes);

// Mount Shop Discovery Routes
router.use('/shops', shopRoutes);

// Mount Admin Routes (Temporarily disabled for location feature testing)
// router.use('/admin', adminRoutes);

export const v1Router = router;
