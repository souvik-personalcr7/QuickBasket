import { NextRequest, NextResponse } from 'next/server';
import { parseJwtPayload, evaluateRouteAccess } from './lib/rbac';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Retrieve auth token from cookie
  const token = req.cookies.get('token')?.value;
  const session = token ? parseJwtPayload(token) : null;

  // Evaluate strict RBAC route rules
  const evaluation = evaluateRouteAccess(pathname, session);

  if (evaluation.action === 'redirect' && evaluation.targetUrl) {
    // Avoid redirect loops
    const targetUrl = new URL(evaluation.targetUrl, req.url);
    if (targetUrl.pathname === pathname) {
      return NextResponse.next();
    }

    const response = NextResponse.redirect(targetUrl);
    if (evaluation.clearSession) {
      response.cookies.delete('token');
    }
    return response;
  }

  if (evaluation.action === 'rewrite' && evaluation.targetUrl) {
    const targetUrl = new URL(evaluation.targetUrl, req.url);
    return NextResponse.rewrite(targetUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mjs|js|css|json)$).*)',
  ],
};

