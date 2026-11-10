import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { v1Router } from './routes';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Allows flexible integration in dev
    crossOriginEmbedderPolicy: false,
  }));

  // CORS Configuration
  app.use(cors({
    origin: (origin, callback) => {
      // In development or local Wi-Fi testing, allow local IP access (e.g. 192.168.x.x)
      if (!origin) return callback(null, true);
      const isAllowed =
        origin === env.CLIENT_URL ||
        /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);
      if (isAllowed || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Body Parsing Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Base API Info
  app.get('/', (req, res) => {
    res.json({
      name: 'QuickBasket API',
      version: '1.0.0',
      status: 'active',
      docs: '/api/v1/health',
    });
  });

  // Mount API v1 Routes
  app.use('/api/v1', v1Router);

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
