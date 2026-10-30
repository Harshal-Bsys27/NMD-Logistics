import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Open your invitation link to continue.' }, { status: 401 });
    }
    if (!user.email_confirmed_at || user.app_metadata?.invite_pending !== true) {
      return NextResponse.json({ error: 'This account does not have a pending invitation.' }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Unable to validate invited profile:', profileError.message);
      return NextResponse.json({ error: 'Unable to validate the invitation.' }, { status: 500 });
    }
    if (!profile || profile.status !== 'inactive' || profile.role !== user.app_metadata.role) {
      return NextResponse.json({ error: 'The invited account role could not be verified.' }, { status: 403 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, invite_pending: false },
    });
    if (updateError) {
      console.error('Unable to finish invitation:', updateError.message);
      return NextResponse.json({ error: 'Unable to finish account setup. Please try again.' }, { status: 500 });
    }

    const { error: activationError } = await admin
      .from('users')
      .update({ status: 'active' })
      .eq('id', user.id)
      .eq('status', 'inactive');

    if (activationError) {
      const { error: rollbackError } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, invite_pending: true },
      });
      if (rollbackError) console.error('Unable to restore pending invite state:', rollbackError.message);
      console.error('Unable to activate invited profile:', activationError.message);
      return NextResponse.json({ error: 'Unable to activate your account. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ accepted: true });
  } catch (error) {
    console.error('Invitation acceptance failed:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({ error: 'Unable to finish account setup.' }, { status: 500 });
  }
}
