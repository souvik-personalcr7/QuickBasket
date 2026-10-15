import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendResponse } from '../utils/apiResponse';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1 || dbState === 2; // In dev, MongoDB might be connecting or local

  sendResponse(res, {
    statusCode: isHealthy ? 200 : 503,
    message: isHealthy ? 'QuickBasket API is healthy' : 'Database service degraded',
    data: {
      status: isHealthy ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        state: dbStatusMap[dbState] || 'unknown',
        name: mongoose.connection.name || 'quickbasket',
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  });
});

export const healthRoutes = router;
