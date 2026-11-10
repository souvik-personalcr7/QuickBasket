import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRouteAccess, DecodedAuthToken } from '../src/lib/rbac';

describe('Frontend Strict RBAC Route Protection Matrix', () => {
  const customerSession: DecodedAuthToken = {
    id: 'cust-123',
    email: 'customer@quickbasket.com',
    role: 'customer',
    isActive: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const shopOwnerSession: DecodedAuthToken = {
    id: 'shop-123',
    email: 'shopowner@quickbasket.com',
    role: 'shop_owner',
    isActive: true,
    isApproved: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const deliverySession: DecodedAuthToken = {
    id: 'del-123',
    email: 'rider@quickbasket.com',
    role: 'delivery_partner',
    isActive: true,
    isApproved: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const adminSession: DecodedAuthToken = {
    id: 'adm-123',
    email: 'admin@quickbasket.com',
    role: 'admin',
    isActive: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  describe('1. CUSTOMER Role Access Rules', () => {
    test('Customer can access customer homepage, cart, checkout, profile and addresses', () => {
      assert.deepEqual(evaluateRouteAccess('/', customerSession).action, 'allow');
      assert.deepEqual(evaluateRouteAccess('/cart', customerSession).action, 'allow');
      assert.deepEqual(evaluateRouteAccess('/buy-now', customerSession).action, 'allow');
      assert.deepEqual(evaluateRouteAccess('/checkout', customerSession).action, 'allow');
      assert.deepEqual(evaluateRouteAccess('/orders', customerSession).action, 'allow');
      assert.deepEqual(evaluateRouteAccess('/favorites', customerSession).action, 'allow');
      assert.deepEqual(evaluateRouteAccess('/profile', customerSession).action, 'allow');
      assert.deepEqual(evaluateRouteAccess('/addresses', customerSession).action, 'allow');
    });

    test('Customer CANNOT access Shop Owner routes and is redirected to Customer home (/)', () => {
      const shopRes = evaluateRouteAccess('/shop', customerSession);
      assert.equal(shopRes.action, 'redirect');
      assert.equal(shopRes.targetUrl, '/');

      const shopDashRes = evaluateRouteAccess('/shop/dashboard', customerSession);
      assert.equal(shopDashRes.action, 'redirect');
      assert.equal(shopDashRes.targetUrl, '/');

      const shopProductsRes = evaluateRouteAccess('/shop/inventory', customerSession);
      assert.equal(shopProductsRes.action, 'redirect');
      assert.equal(shopProductsRes.targetUrl, '/');
    });

    test('Customer CANNOT access Delivery Partner routes and is redirected to Customer home (/)', () => {
      const delRes = evaluateRouteAccess('/delivery', customerSession);
      assert.equal(delRes.action, 'redirect');
      assert.equal(delRes.targetUrl, '/');

      const delDashRes = evaluateRouteAccess('/delivery/dashboard', customerSession);
      assert.equal(delDashRes.action, 'redirect');
      assert.equal(delDashRes.targetUrl, '/');
    });
  });

  describe('2. SHOP_OWNER Role Access Rules', () => {
    test('Shop Owner can access /shop, /shop/dashboard, /profile, /addresses', () => {
      assert.equal(evaluateRouteAccess('/shop', shopOwnerSession).action, 'allow');
      assert.equal(evaluateRouteAccess('/shop/inventory', shopOwnerSession).action, 'allow');
      const dashRes = evaluateRouteAccess('/shop/dashboard', shopOwnerSession);
      assert.ok(dashRes.action === 'allow' || dashRes.action === 'rewrite');
      assert.equal(evaluateRouteAccess('/profile', shopOwnerSession).action, 'allow');
      assert.equal(evaluateRouteAccess('/addresses', shopOwnerSession).action, 'allow');
    });

    test('Shop Owner CANNOT access Customer-only routes or Customer home (/) and is redirected to /shop', () => {
      const homeRes = evaluateRouteAccess('/', shopOwnerSession);
      assert.equal(homeRes.action, 'redirect');
      assert.equal(homeRes.targetUrl, '/shop');

      const cartRes = evaluateRouteAccess('/cart', shopOwnerSession);
      assert.equal(cartRes.action, 'redirect');
      assert.equal(cartRes.targetUrl, '/shop');

      const buyNowRes = evaluateRouteAccess('/buy-now', shopOwnerSession);
      assert.equal(buyNowRes.action, 'redirect');
      assert.equal(buyNowRes.targetUrl, '/shop');

      const checkoutRes = evaluateRouteAccess('/checkout', shopOwnerSession);
      assert.equal(checkoutRes.action, 'redirect');
      assert.equal(checkoutRes.targetUrl, '/shop');

      const ordersRes = evaluateRouteAccess('/orders', shopOwnerSession);
      assert.equal(ordersRes.action, 'redirect');
      assert.equal(ordersRes.targetUrl, '/shop');

      const favRes = evaluateRouteAccess('/favorites', shopOwnerSession);
      assert.equal(favRes.action, 'redirect');
      assert.equal(favRes.targetUrl, '/shop');
    });

    test('Shop Owner CANNOT access Delivery Partner routes and is redirected to /shop', () => {
      const delRes = evaluateRouteAccess('/delivery', shopOwnerSession);
      assert.equal(delRes.action, 'redirect');
      assert.equal(delRes.targetUrl, '/shop');

      const delDashRes = evaluateRouteAccess('/delivery/dashboard', shopOwnerSession);
      assert.equal(delDashRes.action, 'redirect');
      assert.equal(delDashRes.targetUrl, '/shop');
    });
  });

  describe('3. DELIVERY_PARTNER Role Access Rules', () => {
    test('Delivery Partner can access /delivery, /delivery/dashboard, /profile, /addresses', () => {
      assert.equal(evaluateRouteAccess('/delivery', deliverySession).action, 'allow');
      const dashRes = evaluateRouteAccess('/delivery/dashboard', deliverySession);
      assert.ok(dashRes.action === 'allow' || dashRes.action === 'rewrite');
      assert.equal(evaluateRouteAccess('/profile', deliverySession).action, 'allow');
      assert.equal(evaluateRouteAccess('/addresses', deliverySession).action, 'allow');
    });

    test('Delivery Partner CANNOT access Customer-only routes or Customer home (/) and is redirected to /delivery', () => {
      const homeRes = evaluateRouteAccess('/', deliverySession);
      assert.equal(homeRes.action, 'redirect');
      assert.equal(homeRes.targetUrl, '/delivery');

      const cartRes = evaluateRouteAccess('/cart', deliverySession);
      assert.equal(cartRes.action, 'redirect');
      assert.equal(cartRes.targetUrl, '/delivery');

      const buyNowRes = evaluateRouteAccess('/buy-now', deliverySession);
      assert.equal(buyNowRes.action, 'redirect');
      assert.equal(buyNowRes.targetUrl, '/delivery');

      const checkoutRes = evaluateRouteAccess('/checkout', deliverySession);
      assert.equal(checkoutRes.action, 'redirect');
      assert.equal(checkoutRes.targetUrl, '/delivery');

      const ordersRes = evaluateRouteAccess('/orders', deliverySession);
      assert.equal(ordersRes.action, 'redirect');
      assert.equal(ordersRes.targetUrl, '/delivery');

      const favRes = evaluateRouteAccess('/favorites', deliverySession);
      assert.equal(favRes.action, 'redirect');
      assert.equal(favRes.targetUrl, '/delivery');
    });

    test('Delivery Partner CANNOT access Shop Owner routes and is redirected to /delivery', () => {
      const shopRes = evaluateRouteAccess('/shop', deliverySession);
      assert.equal(shopRes.action, 'redirect');
      assert.equal(shopRes.targetUrl, '/delivery');

      const shopDashRes = evaluateRouteAccess('/shop/dashboard', deliverySession);
      assert.equal(shopDashRes.action, 'redirect');
      assert.equal(shopDashRes.targetUrl, '/delivery');
    });
  });

  describe('4. ADMIN Role (Disabled for location testing)', () => {
    test('Admin feature is bypassed/allowed during location testing', () => {
      assert.equal(evaluateRouteAccess('/shop', adminSession).action, 'allow');
      assert.equal(evaluateRouteAccess('/delivery', adminSession).action, 'allow');
      assert.equal(evaluateRouteAccess('/cart', adminSession).action, 'allow');
    });
  });

  describe('5. Unauthenticated User Access', () => {
    test('Allows public browsing of homepage and favorites', () => {
      assert.equal(evaluateRouteAccess('/', null).action, 'allow');
      assert.equal(evaluateRouteAccess('/favorites', null).action, 'allow');
    });

    test('Redirects unauthenticated users from protected routes to login with redirect param', () => {
      const shopRes = evaluateRouteAccess('/shop', null);
      assert.equal(shopRes.action, 'redirect');
      assert.equal(shopRes.targetUrl, '/login?redirect=%2Fshop');

      const deliveryRes = evaluateRouteAccess('/delivery', null);
      assert.equal(deliveryRes.action, 'redirect');
      assert.equal(deliveryRes.targetUrl, '/login?redirect=%2Fdelivery');

      const cartRes = evaluateRouteAccess('/cart', null);
      assert.equal(cartRes.action, 'redirect');
      assert.equal(cartRes.targetUrl, '/login?redirect=%2Fcart');

      const profileRes = evaluateRouteAccess('/profile', null);
      assert.equal(profileRes.action, 'redirect');
      assert.equal(profileRes.targetUrl, '/login?redirect=%2Fprofile');

      const addressesRes = evaluateRouteAccess('/addresses', null);
      assert.equal(addressesRes.action, 'redirect');
      assert.equal(addressesRes.targetUrl, '/login?redirect=%2Faddresses');
    });
  });

  describe('6. Account Status & Session Expiry', () => {
    test('Blocks deactivated account and clears session', () => {
      const deactivatedSession: DecodedAuthToken = {
        ...customerSession,
        isActive: false,
      };
      const res = evaluateRouteAccess('/shop', deactivatedSession);
      assert.equal(res.action, 'redirect');
      assert.equal(res.targetUrl, '/login?error=account_deactivated');
      assert.equal(res.clearSession, true);
    });

    test('Detects expired token on protected route and redirects to login with session_expired', () => {
      const expiredSession: DecodedAuthToken = {
        ...customerSession,
        exp: Math.floor(Date.now() / 1000) - 100, // expired in past
      };
      const res = evaluateRouteAccess('/cart', expiredSession);
      assert.equal(res.action, 'redirect');
      assert.ok(res.targetUrl?.includes('error=session_expired'));
      assert.equal(res.clearSession, true);
    });
  });

  describe('7. Auth Pages (/login, /signup) for Authenticated Users', () => {
    test('Redirects logged in customer to /', () => {
      assert.equal(evaluateRouteAccess('/login', customerSession).targetUrl, '/');
      assert.equal(evaluateRouteAccess('/signup', customerSession).targetUrl, '/');
    });

    test('Redirects logged in shop owner to /shop', () => {
      assert.equal(evaluateRouteAccess('/login', shopOwnerSession).targetUrl, '/shop');
      assert.equal(evaluateRouteAccess('/signup', shopOwnerSession).targetUrl, '/shop');
    });

    test('Redirects logged in delivery partner to /delivery', () => {
      assert.equal(evaluateRouteAccess('/login', deliverySession).targetUrl, '/delivery');
      assert.equal(evaluateRouteAccess('/signup', deliverySession).targetUrl, '/delivery');
    });
  });
});

