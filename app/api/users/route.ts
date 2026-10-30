import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAppUrl } from '@/lib/app-url';

const inviteSupervisorSchema = z.object({
  email: z.string().trim().email().max(254),
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal('')),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid invitation request.' }, { status: 400 });
  }

  const parsed = inviteSupervisorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid staff details.' }, { status: 400 });
  }

  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in to invite staff.' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: actor, error: actorError } = await admin
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (actorError) {
      console.error('Unable to verify staff-invitation permissions:', actorError.message);
      return NextResponse.json({ error: 'Unable to verify your permissions.' }, { status: 500 });
    }
    if (!actor || actor.role !== 'admin' || actor.status !== 'active') {
      return NextResponse.json({ error: 'Only an active administrator can invite supervisors.' }, { status: 403 });
    }

    const input = parsed.data;
    const { data: invitation, error: invitationError } = await admin.auth.admin.inviteUserByEmail(
      input.email,
      {
        data: { full_name: input.full_name, phone: input.phone || null },
        redirectTo: new URL('/auth/callback', getAppUrl(request.url)).toString(),
      }
    );

    if (invitationError || !invitation.user) {
      console.error('Unable to send supervisor invitation:', invitationError?.message);
      const duplicate = invitationError?.message.toLowerCase().includes('already') ?? false;
      return NextResponse.json(
        { error: duplicate ? 'An account with this email already exists.' : 'Unable to send the invitation email. Check the email provider configuration.' },
        { status: duplicate ? 409 : 400 }
      );
    }

    const userId = invitation.user.id;
    const { error: metadataError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { ...invitation.user.app_metadata, role: 'supervisor', invite_pending: true },
    });

    if (metadataError) {
      const { error: rollbackError } = await admin.auth.admin.deleteUser(userId);
      if (rollbackError) console.error('Supervisor invite rollback failed after metadata error:', rollbackError.message);
      console.error('Unable to assign invited supervisor role:', metadataError.message);
      return NextResponse.json({ error: 'Unable to prepare the invited account.' }, { status: 500 });
    }

    const { error: profileError } = await admin.from('users').insert({
      id: userId,
      email: input.email,
      full_name: input.full_name,
      phone: input.phone || null,
      role: 'supervisor',
      status: 'inactive',
      created_by: user.id,
    });

    if (profileError) {
      const { error: rollbackError } = await admin.auth.admin.deleteUser(userId);
      if (rollbackError) console.error('Supervisor invite rollback failed after profile error:', rollbackError.message);
      const duplicate = profileError.code === '23505';
      return NextResponse.json(
        { error: duplicate ? 'A user with this email already exists.' : 'Unable to create the invited profile.' },
        { status: duplicate ? 409 : 500 }
      );
    }

    return NextResponse.json({ invited: true }, { status: 201 });
  } catch (error) {
    console.error('Supervisor invitation failed:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({ error: 'Unable to complete the staff invitation.' }, { status: 500 });
  }
}
