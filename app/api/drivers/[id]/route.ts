import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const driverIdSchema = z.string().uuid();
type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!driverIdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid driver ID.' }, { status: 400 });
  }

  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in to remove a driver.' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: actor, error: actorError } = await admin
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (actorError) {
      console.error('Unable to verify driver-removal permissions:', actorError.message);
      return NextResponse.json({ error: 'Unable to verify your permissions.' }, { status: 500 });
    }
    if (!actor || actor.role !== 'admin' || actor.status !== 'active') {
      return NextResponse.json({ error: 'Only an active administrator can remove drivers.' }, { status: 403 });
    }

    const { data: driver, error: driverError } = await admin
      .from('delivery_personnel')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (driverError) {
      console.error('Unable to load driver for removal:', driverError.message);
      return NextResponse.json({ error: 'Unable to load this driver.' }, { status: 500 });
    }
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found.' }, { status: 404 });
    }

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role, status')
      .eq('id', driver.user_id)
      .maybeSingle();

    if (profileError) {
      console.error('Unable to verify driver profile for removal:', profileError.message);
      return NextResponse.json({ error: 'Unable to verify this driver.' }, { status: 500 });
    }
    if (!profile || profile.role !== 'delivery_personnel') {
      return NextResponse.json({ error: 'This account is not an active driver profile.' }, { status: 409 });
    }
    if (profile.status === 'suspended') {
      return NextResponse.json({ removed: true, alreadyRemoved: true });
    }

    const { data: activeAssignment, error: assignmentError } = await admin
      .from('order_assignments')
      .select('id')
      .eq('personnel_id', id)
      .in('status', ['pending', 'accepted', 'in_progress'])
      .limit(1)
      .maybeSingle();

    if (assignmentError) {
      console.error('Unable to check active assignments before driver removal:', assignmentError.message);
      return NextResponse.json({ error: 'Unable to verify the driver’s active assignments.' }, { status: 500 });
    }
    if (activeAssignment) {
      return NextResponse.json(
        { error: 'This driver has an active assignment. Complete or cancel it before removing the driver.' },
        { status: 409 }
      );
    }

    const { data: updatedProfile, error: updateError } = await admin
      .from('users')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', driver.user_id)
      .eq('role', 'delivery_personnel')
      .neq('status', 'suspended')
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Unable to suspend removed driver:', updateError.message);
      return NextResponse.json({ error: 'Unable to remove this driver.' }, { status: 500 });
    }
    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'The driver account changed while you were removing it. Refresh and try again.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error('Driver removal failed:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({ error: 'Unable to remove this driver.' }, { status: 500 });
  }
}
