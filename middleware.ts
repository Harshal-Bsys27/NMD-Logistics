import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_ROUTES = ['/auth', '/auth/signin', '/auth/signup', '/auth/forgot-password'];
const PROTECTED_ROUTES = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const url = nextUrl.clone();
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken);

  const pathname = nextUrl.pathname;

  if (PROTECTED_ROUTES.some((route) => pathname === route)) {
    if (!isAuthenticated) {
      url.pathname = '/auth/signin';
      return NextResponse.redirect(url);
    }
  }

  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (isAuthenticated) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/auth/:path*'],
};
