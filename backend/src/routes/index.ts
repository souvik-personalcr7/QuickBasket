import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { addressRoutes } from './address.routes';
import { orderRoutes } from './order.routes';

const router = Router();

// Mount Health Check
router.use('/health', healthRoutes);

// Mount Auth Routes (Role-based Sign up, Login, Profile, Logout)
router.use('/auth', authRoutes);

// Mount Address Management Routes
router.use('/addresses', addressRoutes);

// Mount Order Management Routes
router.use('/orders', orderRoutes);

export const v1Router = router;

