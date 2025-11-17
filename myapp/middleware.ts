import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/onboarding'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Check for session cookie
  const sessionCookie = request.cookies.get('myapp_session');
  const hasSession = sessionCookie?.value;

  // Redirect unauthenticated users to login (except for public routes)
  if (!hasSession && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/onboarding
  if (hasSession && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();

  // Add security headers (complement next.config.ts headers)
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Add cache control for static assets
  if (pathname.startsWith('/_next/static')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Add no-cache for API routes and data
  if (pathname.startsWith('/api')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
  }

  return response;
}

// Configure which routes should use the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * - icon.svg (app icon)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon.svg).*)',
  ],
};
