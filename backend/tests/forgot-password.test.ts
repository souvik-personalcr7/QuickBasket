import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { User } from '../src/models/User';
import { forgotPassword, verifyOtp, resetPassword } from '../src/controllers/auth.controller';

// Helper to mock Express Request and Response
function createMockHttp(body: Record<string, any> = {}) {
  const req = {
    body,
    cookies: {},
    headers: {},
    params: {},
    query: {},
  } as any;

  let statusCode = 200;
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

  return {
    req,
    res,
    next,
    getStatusCode: () => statusCode,
    getData: () => responseData,
    getError: () => caughtError,
  };
}

describe('Forgot Password & Email OTP Recovery Flow', () => {
  const originalFindOne = User.findOne;

  afterEach(() => {
    User.findOne = originalFindOne;
  });

  it('1. Rejects forgot-password request for nonexistent email with 404', async () => {
    User.findOne = (() => Promise.resolve(null)) as any;

    const http = createMockHttp({ email: 'nonexistent@quickbasket.com' });
    await forgotPassword(http.req, http.res, http.next);

    assert.ok(http.getError());
    assert.strictEqual(http.getError().statusCode, 404);
    assert.ok(http.getError().message.includes('No account found'));
  });

  it('2. Dispatches 6-digit OTP for registered user and sets 10-minute expiry', async () => {
    let saved = false;
    const mockUser: any = {
      name: 'Rohan Sharma',
      email: 'rohan@quickbasket.com',
      save: async () => {
        saved = true;
      },
    };

    User.findOne = (() => Promise.resolve(mockUser)) as any;

    const http = createMockHttp({ email: 'rohan@quickbasket.com' });
    await forgotPassword(http.req, http.res, http.next);

    assert.strictEqual(http.getError(), null);
    assert.strictEqual(http.getStatusCode(), 200);
    assert.ok(saved);
    assert.strictEqual(mockUser.resetPasswordOtp?.length, 6);
    assert.ok(mockUser.resetPasswordOtpExpires);
    assert.ok(mockUser.resetPasswordOtpExpires.getTime() > Date.now());
  });

  it('3. Rejects invalid OTP with 400', async () => {
    const mockUser: any = {
      email: 'rohan@quickbasket.com',
      resetPasswordOtp: '123456',
      resetPasswordOtpExpires: new Date(Date.now() + 600000),
    };

    const mockQuery: any = {
      select: () => Promise.resolve(mockUser),
    };
    User.findOne = (() => mockQuery) as any;

    const http = createMockHttp({
      email: 'rohan@quickbasket.com',
      otp: '999999',
    });
    await verifyOtp(http.req, http.res, http.next);

    assert.ok(http.getError());
    assert.strictEqual(http.getError().statusCode, 400);
    assert.ok(http.getError().message.includes('Invalid or expired'));
  });

  it('4. Rejects expired OTP with 400', async () => {
    const mockUser: any = {
      email: 'rohan@quickbasket.com',
      resetPasswordOtp: '123456',
      resetPasswordOtpExpires: new Date(Date.now() - 5000), // Expired in past
    };

    const mockQuery: any = {
      select: () => Promise.resolve(mockUser),
    };
    User.findOne = (() => mockQuery) as any;

    const http = createMockHttp({
      email: 'rohan@quickbasket.com',
      otp: '123456',
    });
    await verifyOtp(http.req, http.res, http.next);

    assert.ok(http.getError());
    assert.strictEqual(http.getError().statusCode, 400);
    assert.ok(http.getError().message.includes('Invalid or expired'));
  });

  it('5. Successfully verifies correct unexpired OTP', async () => {
    const mockUser: any = {
      email: 'rohan@quickbasket.com',
      resetPasswordOtp: '654321',
      resetPasswordOtpExpires: new Date(Date.now() + 600000),
    };

    const mockQuery: any = {
      select: () => Promise.resolve(mockUser),
    };
    User.findOne = (() => mockQuery) as any;

    const http = createMockHttp({
      email: 'rohan@quickbasket.com',
      otp: '654321',
    });
    await verifyOtp(http.req, http.res, http.next);

    assert.strictEqual(http.getError(), null);
    assert.strictEqual(http.getStatusCode(), 200);
    assert.strictEqual(http.getData().data.verified, true);
  });

  it('6. Successfully resets password and clears OTP fields', async () => {
    let saved = false;
    const mockUser: any = {
      email: 'rohan@quickbasket.com',
      password: 'oldPassword123',
      resetPasswordOtp: '654321',
      resetPasswordOtpExpires: new Date(Date.now() + 600000),
      save: async () => {
        saved = true;
      },
    };

    const mockQuery: any = {
      select: () => Promise.resolve(mockUser),
    };
    User.findOne = (() => mockQuery) as any;

    const newPass = 'brandNewPassword999';
    const http = createMockHttp({
      email: 'rohan@quickbasket.com',
      otp: '654321',
      newPassword: newPass,
    });
    await resetPassword(http.req, http.res, http.next);

    assert.strictEqual(http.getError(), null);
    assert.strictEqual(http.getStatusCode(), 200);
    assert.ok(saved);
    assert.strictEqual(mockUser.password, newPass);
    assert.strictEqual(mockUser.resetPasswordOtp, undefined);
    assert.strictEqual(mockUser.resetPasswordOtpExpires, undefined);
  });
});
