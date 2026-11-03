import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppUrl } from '@/lib/app-url';
import { sendCustomerTrackingEmail } from '@/lib/email/customer-feedback';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const requestSchema = z.object({
  order_id: z.string().uuid(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid tracking email request.' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid order ID is required.' }, { status: 400 });
  }

  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in to send a tracking link.' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: actor, error: actorError } = await admin
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();
    if (actorError) {
      console.error('Unable to verify customer tracking permissions:', actorError.message);
      return NextResponse.json({ error: 'Unable to verify your permissions.' }, { status: 500 });
    }
    if (!actor || actor.status !== 'active' || !['admin', 'supervisor'].includes(actor.role)) {
      return NextResponse.json({ error: 'Only active administrators and supervisors can send tracking links.' }, { status: 403 });
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, order_number, client_name, client_email, status')
      .eq('id', parsed.data.order_id)
      .maybeSingle();
    if (orderError) {
      console.error('Unable to load order for customer tracking email:', orderError.message);
      return NextResponse.json({ error: 'Unable to load this order.' }, { status: 500 });
    }
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (order.status === 'draft') {
      return NextResponse.json({ error: 'Release the order for dispatch before sending a tracking link.' }, { status: 409 });
    }
    if (!order.client_email?.trim()) {
      return NextResponse.json({ error: 'Add a customer email address before sending a tracking link.' }, { status: 409 });
    }

    const appUrl = getAppUrl(request.url);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: saveError } = await admin
      .from('customer_tracking_links')
      .insert({
        order_id: order.id,
        token_hash: createHash('sha256').update(token).digest('hex'),
        expires_at: expiresAt,
        created_by: user.id,
      });
    if (saveError) {
      console.error('Unable to create customer tracking link:', saveError.message);
      return NextResponse.json({ error: 'Unable to create a tracking link for this order.' }, { status: 500 });
    }

    try {
      await sendCustomerTrackingEmail({
        to: order.client_email.trim(),
        orderNumber: order.order_number,
        customerName: order.client_name,
        trackingUrl: new URL(`/track/${token}`, appUrl).toString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email provider request failed.';
      console.error('Customer tracking email failed:', message);
      return NextResponse.json(
        { error: 'The tracking link was created, but the email could not be sent. Check the email settings and try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ status: 'accepted' });
  } catch (error) {
    console.error('Customer tracking link request failed:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({ error: 'Unable to send the tracking email.' }, { status: 500 });
  }
}
