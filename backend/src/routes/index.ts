import { Router } from 'express';
import { healthRoutes } from './health.routes';

const router = Router();

// Mount Health Check
router.use('/health', healthRoutes);

// Other route groups will be mounted here in subsequent phases:
// /auth, /customer, /shops, /products, /orders, /delivery, /admin

export const v1Router = router;
