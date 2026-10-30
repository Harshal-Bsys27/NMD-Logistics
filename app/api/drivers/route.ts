import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createDriverAccountSchema } from '@/lib/validations/schemas';
import { getAppUrl } from '@/lib/app-url';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid driver registration request.' }, { status: 400 });
  }

  const parsed = createDriverAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid driver details.' }, { status: 400 });
  }

  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in to add a driver.' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: actor, error: actorError } = await admin
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (actorError) {
      console.error('Unable to verify driver-creation permissions:', actorError.message);
      return NextResponse.json({ error: 'Unable to verify your permissions.' }, { status: 500 });
    }
    if (!actor || actor.status !== 'active' || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Only an active administrator can invite drivers.' }, { status: 403 });
    }

    const input = parsed.data;
    const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(input.email, {
      data: { full_name: input.full_name, phone: input.phone },
      redirectTo: new URL('/auth/callback', getAppUrl(request.url)).toString(),
    });

    if (inviteError || !invitation.user) {
      console.error('Unable to send driver invitation:', inviteError?.message);
      const duplicate = inviteError?.message.toLowerCase().includes('already') ?? false;
      return NextResponse.json(
        { error: duplicate ? 'An account with this email already exists.' : 'Unable to send the invitation email. Check the email provider configuration.' },
        { status: duplicate ? 409 : 400 }
      );
    }

    const userId = invitation.user.id;
    const { error: metadataError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...invitation.user.user_metadata, full_name: input.full_name, phone: input.phone },
      app_metadata: { ...invitation.user.app_metadata, role: 'delivery_personnel', invite_pending: true },
    });
    if (metadataError) {
      const { error: rollbackError } = await admin.auth.admin.deleteUser(userId);
      if (rollbackError) console.error('Driver invite rollback failed after metadata error:', rollbackError.message);
      console.error('Unable to assign invited driver role:', metadataError.message);
      return NextResponse.json({ error: 'Unable to prepare the invited driver account.' }, { status: 500 });
    }

    const { error: profileError } = await admin.from('users').insert({
      id: userId,
      email: input.email,
      full_name: input.full_name,
      phone: input.phone,
      role: 'delivery_personnel',
      status: 'inactive',
      created_by: user.id,
    });

    if (profileError) {
      const { error: rollbackError } = await admin.auth.admin.deleteUser(userId);
      if (rollbackError) console.error('Driver invite rollback failed after profile insert error:', rollbackError.message);
      const duplicate = profileError.code === '23505';
      return NextResponse.json(
        { error: duplicate ? 'A user with this email already exists.' : 'Unable to create the invited driver profile.' },
        { status: duplicate ? 409 : 500 }
      );
    }

    const { error: personnelError } = await admin.from('delivery_personnel').insert({
      user_id: userId,
      employee_id: input.employee_id,
      vehicle_type: input.vehicle_type,
      vehicle_number: input.vehicle_number,
      license_number: input.license_number || null,
      current_status: 'available',
      total_deliveries_completed: 0,
      rating: 0,
      phone_verified: false,
    });

    if (personnelError) {
      const { error: profileRollbackError } = await admin.from('users').delete().eq('id', userId);
      const { error: authRollbackError } = await admin.auth.admin.deleteUser(userId);
      if (profileRollbackError) console.error('Driver profile rollback failed:', profileRollbackError.message);
      if (authRollbackError) console.error('Driver auth rollback failed:', authRollbackError.message);
      const duplicate = personnelError.code === '23505';
      return NextResponse.json(
        { error: duplicate ? 'Employee ID or vehicle number already exists.' : 'Unable to create the driver record.' },
        { status: duplicate ? 409 : 500 }
      );
    }

    return NextResponse.json({ invited: true }, { status: 201 });
  } catch (error) {
    console.error('Driver onboarding failed:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({ error: 'Unable to complete driver onboarding.' }, { status: 500 });
  }
}
