import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';

const router = Router();

// Mount Health Check
router.use('/health', healthRoutes);

// Mount Auth Routes (Role-based Sign up, Login, Profile, Logout)
router.use('/auth', authRoutes);

// Other route groups will be mounted here in subsequent phases:
// /customer, /shops, /products, /orders, /delivery, /admin

export const v1Router = router;

