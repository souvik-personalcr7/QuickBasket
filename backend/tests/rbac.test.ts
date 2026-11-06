import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { authorize, requireActive, requireApproved, AuthenticatedRequest } from '../src/middleware/auth.middleware';
import { signToken } from '../src/controllers/auth.controller';
import { IUser } from '../src/models/User';
import { AppError } from '../src/utils/appError';
import { env } from '../src/config/env';

// Helper to mock Express Request, Response, Next
function createMockContext(user?: Partial<IUser>) {
  const req = {
    user: user as IUser,
    cookies: {},
    headers: {},
    body: {},
    params: {},
    query: {},
  } as unknown as AuthenticatedRequest;

  let statusCode: number | null = null;
  let responseData: any = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    cookie: () => res,
  } as any;

  let caughtError: any = null;
  const next = (err?: any) => {
    if (err) caughtError = err;
  };

  return { req, res, next, getError: () => caughtError, getStatusCode: () => statusCode };
}

describe('Strict RBAC Backend Middleware & Authorization Tests', () => {
  describe('authorize() role guard', () => {
    it('should allow customer to access customer-authorized endpoints', () => {
      const ctx = createMockContext({
        role: 'customer',
        isActive: true,
      });

      const guard = authorize('customer', 'admin');
      guard(ctx.req, ctx.res, ctx.next);

      assert.strictEqual(ctx.getError(), null);
    });

    it('should reject shop owner from calling customer-only endpoints (e.g. POST /orders) with 403', () => {
      const ctx = createMockContext({
        role: 'shop_owner',
        isActive: true,
      });

      const guard = authorize('customer', 'admin');
      guard(ctx.req, ctx.res, ctx.next);

      const err = ctx.getError();
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 403);
      assert.match(err.message, /not authorized/i);
    });

    it('should reject delivery partner from calling customer-only endpoints with 403', () => {
      const ctx = createMockContext({
        role: 'delivery_partner',
        isActive: true,
      });

      const guard = authorize('customer', 'admin');
      guard(ctx.req, ctx.res, ctx.next);

      const err = ctx.getError();
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 403);
    });

    it('should allow shop owner to access shop management endpoints', () => {
      const ctx = createMockContext({
        role: 'shop_owner',
        isActive: true,
      });

      const guard = authorize('shop_owner', 'admin');
      guard(ctx.req, ctx.res, ctx.next);

      assert.strictEqual(ctx.getError(), null);
    });

    it('should reject customer from calling shop management endpoints (e.g. PATCH /auth/shop-details) with 403', () => {
      const ctx = createMockContext({
        role: 'customer',
        isActive: true,
      });

      const guard = authorize('shop_owner', 'admin');
      guard(ctx.req, ctx.res, ctx.next);

      const err = ctx.getError();
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 403);
      assert.match(err.message, /Role 'customer' is not authorized/i);
    });

    it('should reject delivery partner from calling shop management endpoints with 403', () => {
      const ctx = createMockContext({
        role: 'delivery_partner',
        isActive: true,
      });

      const guard = authorize('shop_owner', 'admin');
      guard(ctx.req, ctx.res, ctx.next);

      const err = ctx.getError();
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 403);
    });

    it('should reject unauthenticated caller with 401', () => {
      const ctx = createMockContext(undefined);

      const guard = authorize('customer');
      guard(ctx.req, ctx.res, ctx.next);

      const err = ctx.getError();
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 401);
    });
  });

  describe('requireActive() account status guard', () => {
    it('should allow active user account to proceed', () => {
      const ctx = createMockContext({
        role: 'customer',
        isActive: true,
      });

      requireActive(ctx.req, ctx.res, ctx.next);
      assert.strictEqual(ctx.getError(), null);
    });

    it('should block suspended or deactivated account with 403', () => {
      const ctx = createMockContext({
        role: 'customer',
        isActive: false,
      });

      requireActive(ctx.req, ctx.res, ctx.next);
      const err = ctx.getError();
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 403);
      assert.match(err.message, /suspended or deactivated/i);
    });
  });

  describe('requireApproved() approval workflow guard (Admin Verification Disabled)', () => {
    it('should allow shop owner without requiring admin approval', () => {
      const ctx = createMockContext({
        role: 'shop_owner',
        isActive: true,
      });

      requireApproved(ctx.req, ctx.res, ctx.next);
      assert.strictEqual(ctx.getError(), null);
    });

    it('should allow delivery partner without requiring admin approval', () => {
      const ctx = createMockContext({
        role: 'delivery_partner',
        isActive: true,
      });

      requireApproved(ctx.req, ctx.res, ctx.next);
      assert.strictEqual(ctx.getError(), null);
    });
  });

  describe('signToken() security payload verification', () => {
    it('should embed trusted role, active status and approval flag into signed JWT', () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'merchant@quickbasket.com',
        role: 'shop_owner',
        isActive: true,
      } as unknown as IUser;

      const token = signToken(mockUser);
      assert.ok(token);

      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      assert.strictEqual(decoded.id, '507f1f77bcf86cd799439011');
      assert.strictEqual(decoded.role, 'shop_owner');
      assert.strictEqual(decoded.email, 'merchant@quickbasket.com');
      assert.strictEqual(decoded.isActive, true);
      assert.strictEqual(decoded.isApproved, true);
    });
  });
});

