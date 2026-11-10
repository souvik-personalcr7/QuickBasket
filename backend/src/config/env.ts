import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/quickbasket'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('super_secret_jwt_key_quickbasket_development_change_in_production'),
  JWT_EXPIRES_IN: z.string().default('365d'),
  DEV_ADMIN_KEY: z.string().default('dev_secret_admin_key_2026'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 587)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('QuickBasket <no-reply@quickbasket.com>'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment configuration:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
