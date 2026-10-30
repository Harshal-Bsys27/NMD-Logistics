import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const admin = getSupabaseAdmin();
        const { data: profile, error: profileLookupError } = await admin
          .from('users')
          .select('id, status')
          .eq('id', user.id)
          .maybeSingle();

        if (profileLookupError) {
          await supabase.auth.signOut();
          return redirectToSignIn(requestUrl.origin, 'access');
        }

        if (!profile || !user.email_confirmed_at) {
          await supabase.auth.signOut();
          return redirectToSignIn(requestUrl.origin, 'invite');
        }

        const isPendingInvite = user.app_metadata?.invite_pending === true && profile.status === 'inactive';
        if (!isPendingInvite && profile.status !== 'active') {
          await supabase.auth.signOut();
          return redirectToSignIn(requestUrl.origin, 'access');
        }

        const destination = isPendingInvite ? '/auth/accept-invite' : '/dashboard';
        return NextResponse.redirect(new URL(destination, requestUrl.origin));
      }
    }
  }

  return redirectToSignIn(requestUrl.origin, 'google');
}

function redirectToSignIn(origin: string, reason: 'google' | 'invite' | 'access') {
  const signInUrl = new URL('/auth/signin', origin);
  signInUrl.searchParams.set('error', reason);
  return NextResponse.redirect(signInUrl);
}