import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value });
          const nextResponse = NextResponse.next({ request });
          response.cookies.getAll().forEach((cookie) => nextResponse.cookies.set(cookie));
          response = nextResponse;
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '' });
          const nextResponse = NextResponse.next({ request });
          response.cookies.getAll().forEach((cookie) => nextResponse.cookies.set(cookie));
          response = nextResponse;
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');
  const isPublicRoute = pathname === '/' || pathname === '/auth/signout';
  const isAcceptInviteRoute = pathname === '/auth/accept-invite';

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.search = '';
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (user && user.app_metadata?.invite_pending === true && !isAcceptInviteRoute && pathname !== '/auth/signout') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/accept-invite';
    url.search = '';
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (user && isAcceptInviteRoute && user.app_metadata?.invite_pending !== true) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (user && !isAuthRoute && pathname !== '/auth/signout') {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile || profile.status !== 'active') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.search = '?error=access';
      const redirectResponse = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }

    const isAdmin = profile.role === 'admin';
    const isDeliveryPersonnel = profile.role === 'delivery_personnel';
    const isAdminOnlyRoute = pathname === '/users' || pathname.startsWith('/users/') || pathname === '/api-docs' || pathname.startsWith('/api-docs/');
    const isDriverAllowedRoute = pathname === '/assignments' ||
      pathname.startsWith('/assignments/') ||
      pathname === '/help' ||
      pathname.startsWith('/help/') ||
      pathname === '/status' ||
      pathname.startsWith('/status/');

    if ((isAdminOnlyRoute && !isAdmin) || (isDeliveryPersonnel && !isDriverAllowedRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = isDeliveryPersonnel ? '/assignments' : '/dashboard';
      url.search = '';
      const redirectResponse = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
  }

  if (user && isAuthRoute && pathname !== '/auth/signout' && !isAcceptInviteRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (profile) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      const redirectResponse = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
