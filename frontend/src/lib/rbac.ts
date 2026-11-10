export type AppRole = 'customer' | 'shop_owner' | 'delivery_partner' | 'admin';

export interface DecodedAuthToken {
  id: string;
  role: AppRole;
  email: string;
  isActive?: boolean;
  isApproved?: boolean;
  exp?: number;
  iat?: number;
}

export const ROLE_DASHBOARDS: Record<AppRole, string> = {
  customer: '/',
  shop_owner: '/shop',
  delivery_partner: '/delivery',
  admin: '/',
};

/**
 * Parse JWT payload safely in any JavaScript runtime without external libraries.
 */
export function parseJwtPayload(token: string): DecodedAuthToken | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed || !parsed.role) return null;
    return parsed as DecodedAuthToken;
  } catch {
    return null;
  }
}

// Route Category Matchers
export function isShopRoute(pathname: string): boolean {
  return pathname === '/shop' || pathname.startsWith('/shop/');
}

export function isDeliveryRoute(pathname: string): boolean {
  return pathname === '/delivery' || pathname.startsWith('/delivery/');
}

export function isCustomerOnlyRoute(pathname: string): boolean {
  return (
    pathname === '/cart' ||
    pathname.startsWith('/cart/') ||
    pathname === '/buy-now' ||
    pathname.startsWith('/buy-now/') ||
    pathname === '/checkout' ||
    pathname.startsWith('/checkout/') ||
    pathname === '/orders' ||
    pathname.startsWith('/orders/')
  );
}

export function isSharedAuthRoute(pathname: string): boolean {
  return (
    pathname === '/profile' ||
    pathname.startsWith('/profile/') ||
    pathname === '/addresses' ||
    pathname.startsWith('/addresses/')
  );
}

export function isAuthPageRoute(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/signup' ||
    pathname.startsWith('/signup/') ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/forgot-password/')
  );
}

export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    isAuthPageRoute(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  );
}

export interface RouteAccessEvaluation {
  action: 'allow' | 'redirect' | 'rewrite';
  targetUrl?: string;
  clearSession?: boolean;
  reason?: string;
}

/**
 * Pure evaluation function for RBAC rules across all route and role combinations.
 */
export function evaluateRouteAccess(
  pathname: string,
  session: DecodedAuthToken | null
): RouteAccessEvaluation {
  // Normalize path (strip trailing slash if not root)
  const normPath = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // 1. Session Validity Checks
  if (session) {
    if (session.exp && session.exp < Date.now() / 1000) {
      const isProtected =
        isShopRoute(normPath) ||
        isDeliveryRoute(normPath) ||
        isCustomerOnlyRoute(normPath) ||
        isSharedAuthRoute(normPath);

      return {
        action: isProtected ? 'redirect' : 'allow',
        targetUrl: isProtected
          ? `/login?error=session_expired&redirect=${encodeURIComponent(normPath)}`
          : undefined,
        clearSession: true,
        reason: 'Session has expired',
      };
    }

    if (session.isActive === false) {
      return {
        action: 'redirect',
        targetUrl: '/login?error=account_deactivated',
        clearSession: true,
        reason: 'Account is deactivated',
      };
    }
  }

  // 2. Unauthenticated User Evaluation
  if (!session) {
    if (
      isShopRoute(normPath) ||
      isDeliveryRoute(normPath) ||
      isCustomerOnlyRoute(normPath) ||
      isSharedAuthRoute(normPath)
    ) {
      return {
        action: 'redirect',
        targetUrl: `/login?redirect=${encodeURIComponent(normPath)}`,
        reason: 'Authentication required for protected route',
      };
    }
    return { action: 'allow' };
  }

  // 3. Authenticated Users on Auth Pages (/login, /signup)
  if (isAuthPageRoute(normPath)) {
    const defaultDashboard = ROLE_DASHBOARDS[session.role] || '/';
    return {
      action: 'redirect',
      targetUrl: defaultDashboard,
      reason: 'Authenticated users are redirected away from auth pages',
    };
  }

  // 4. Role-Specific Access Rules
  const role = session.role;

  // --- CUSTOMER ---
  if (role === 'customer') {
    if (isShopRoute(normPath)) {
      return {
        action: 'redirect',
        targetUrl: '/',
        reason: 'Customer is not allowed to access Shop Owner routes',
      };
    }
    if (isDeliveryRoute(normPath)) {
      return {
        action: 'redirect',
        targetUrl: '/',
        reason: 'Customer is not allowed to access Delivery Partner routes',
      };
    }
    return { action: 'allow' };
  }

  // --- SHOP OWNER ---
  if (role === 'shop_owner') {
    if (isCustomerOnlyRoute(normPath) || normPath === '/' || normPath === '/favorites' || normPath.startsWith('/favorites/')) {
      return {
        action: 'redirect',
        targetUrl: '/shop',
        reason: 'Shop Owner is not allowed to access Customer routes',
      };
    }
    if (isDeliveryRoute(normPath)) {
      return {
        action: 'redirect',
        targetUrl: '/shop',
        reason: 'Shop Owner is not allowed to access Delivery Partner routes',
      };
    }
    if (normPath === '/shop/dashboard') {
      return {
        action: 'rewrite',
        targetUrl: '/shop',
        reason: 'Rewrite /shop/dashboard alias to /shop',
      };
    }
    return { action: 'allow' };
  }

  // --- DELIVERY PARTNER ---
  if (role === 'delivery_partner') {
    if (isCustomerOnlyRoute(normPath) || normPath === '/' || normPath === '/favorites' || normPath.startsWith('/favorites/')) {
      return {
        action: 'redirect',
        targetUrl: '/delivery',
        reason: 'Delivery Partner is not allowed to access Customer routes',
      };
    }
    if (isShopRoute(normPath)) {
      return {
        action: 'redirect',
        targetUrl: '/delivery',
        reason: 'Delivery Partner is not allowed to access Shop Owner routes',
      };
    }
    if (normPath === '/delivery/dashboard') {
      return {
        action: 'rewrite',
        targetUrl: '/delivery',
        reason: 'Rewrite /delivery/dashboard alias to /delivery',
      };
    }
    return { action: 'allow' };
  }

  // --- ADMIN (Disabled during location feature testing) ---
  if (role === 'admin') {
    return { action: 'allow' };
  }

  return { action: 'allow' };
}

