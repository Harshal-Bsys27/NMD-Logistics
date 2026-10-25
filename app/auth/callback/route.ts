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
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileLookupError && !profile) {
          const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
          const fullName = typeof metadataName === 'string' ? metadataName : user.email.split('@')[0];
          const { error: profileCreateError } = await admin.from('users').insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            role: 'supervisor',
            status: 'active',
          });

          if (profileCreateError) {
            await supabase.auth.signOut();
            return redirectToSignIn(requestUrl.origin);
          }
        } else if (profileLookupError) {
          await supabase.auth.signOut();
          return redirectToSignIn(requestUrl.origin);
        }

        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      }
    }
  }

  return redirectToSignIn(requestUrl.origin);
}

function redirectToSignIn(origin: string) {
  const signInUrl = new URL('/auth/signin', origin);
  signInUrl.searchParams.set('error', 'google');
  return NextResponse.redirect(signInUrl);
}