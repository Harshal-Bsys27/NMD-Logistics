import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppUrl } from '@/lib/app-url';
import { sendCustomerTrackingUpdateEmail } from '@/lib/email/customer-feedback';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const requestSchema = z.object({
  order_id: z.string().uuid(),
  event: z.enum(['assigned', 'in_transit']),
});

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

async function getActorId(request: Request, admin: AdminClient) {
  const authorization = request.headers.get('authorization');
  if (authorization) {
    const accessToken = /^Bearer\s+(\S+)$/i.exec(authorization)?.[1];
    if (!accessToken) return null;
    const { data, error } = await admin.auth.getUser(accessToken);
    return error || !data.user ? null : data.user.id;
  }

  const sessionClient = await createSupabaseServerClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  return error || !user ? null : user.id;
}

async function updateNotification(
  admin: AdminClient,
  id: string,
  update: Record<string, string | null | number>,
) {
  const { error } = await admin
    .from('customer_tracking_notifications')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('Unable to update customer tracking email status:', error.message);
    throw new Error('Unable to save the customer tracking email status.');
  }
}

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response({ error: 'Invalid customer tracking notification request.' }, 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return response({ error: 'A valid order ID and tracking event are required.' }, 400);
  }

  try {
    const admin = getSupabaseAdmin();
    const userId = await getActorId(request, admin);
    if (!userId) return response({ error: 'Sign in to send a customer update.' }, 401);

    const { data: actor, error: actorError } = await admin
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .maybeSingle();
    if (actorError) {
      console.error('Unable to verify customer tracking notification permissions:', actorError.message);
      return response({ error: 'Unable to verify your permissions.' }, 500);
    }
    if (!actor || actor.status !== 'active') return response({ error: 'Your account is not active.' }, 403);
    const isStaff = actor.role === 'admin' || actor.role === 'supervisor';
    if (!isStaff && actor.role !== 'delivery_personnel') {
      return response({ error: 'You are not allowed to send customer updates.' }, 403);
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, order_number, client_name, client_email, delivery_email_consent, status')
      .eq('id', parsed.data.order_id)
      .maybeSingle();
    if (orderError) {
      console.error('Unable to load order for tracking notification:', orderError.message);
      return response({ error: 'Unable to load this order.' }, 500);
    }
    if (!order) return response({ error: 'Order not found.' }, 404);

    const { data: assignments, error: assignmentsError } = await admin
      .from('order_assignments')
      .select('id, personnel_id, status')
      .eq('order_id', order.id)
      .in('status', ['pending', 'accepted', 'in_progress', 'completed'])
      .order('assigned_at', { ascending: false });
    if (assignmentsError) {
      console.error('Unable to verify order assignment for tracking notification:', assignmentsError.message);
      return response({ error: 'Unable to verify the order assignment.' }, 500);
    }
    const assignment = assignments?.[0];
    if (!assignment) return response({ error: 'Assign this order before sending a tracking update.' }, 409);

    if (actor.role === 'delivery_personnel') {
      if (parsed.data.event !== 'in_transit' || assignment.status !== 'in_progress') {
        return response({ error: 'Drivers can send updates only when starting their assigned delivery.' }, 403);
      }
      const { data: personnel, error: personnelError } = await admin
        .from('delivery_personnel')
        .select('user_id')
        .eq('id', assignment.personnel_id)
        .maybeSingle();
      if (personnelError) {
        console.error('Unable to verify driver for tracking notification:', personnelError.message);
        return response({ error: 'Unable to verify your assignment.' }, 500);
      }
      if (personnel?.user_id !== userId) return response({ error: 'You can update only your own delivery.' }, 403);
    }

    if (parsed.data.event === 'assigned' && !['assigned', 'in_transit', 'delivered'].includes(order.status)) {
      return response({ error: 'The order has not reached the assigned stage.' }, 409);
    }
    if (parsed.data.event === 'in_transit' && !['in_transit', 'delivered'].includes(order.status)) {
      return response({ error: 'The order has not started delivery yet.' }, 409);
    }

    const { data: previous, error: previousError } = await admin
      .from('customer_tracking_notifications')
      .select('id, status, attempt_count, updated_at')
      .eq('assignment_id', assignment.id)
      .eq('event', parsed.data.event)
      .maybeSingle();
    if (previousError) {
      console.error('Unable to check duplicate customer update:', previousError.message);
      return response({ error: 'Unable to check the customer update status.' }, 500);
    }
    if (previous?.status === 'sent') return response({ status: 'already_sent' });
    if (previous?.status === 'skipped') return response({ status: 'skipped' });
    if (previous?.status === 'sending') {
      return response({ error: 'This customer update is already being processed.' }, 409);
    }

    if (!order.delivery_email_consent || !order.client_email?.trim()) {
      const lastError = !order.delivery_email_consent
        ? 'Customer email consent was not recorded.'
        : 'No customer email address is available.';
      if (previous) {
        await updateNotification(admin, previous.id, { status: 'skipped', last_error: lastError });
      } else {
        const { error } = await admin.from('customer_tracking_notifications').insert({
          order_id: order.id,
          assignment_id: assignment.id,
          event: parsed.data.event,
          status: 'skipped',
          attempt_count: 0,
          last_error: lastError,
        });
        if (error && error.code !== '23505') {
          console.error('Unable to record skipped customer update:', error.message);
          return response({ error: 'Unable to record the skipped customer update.' }, 500);
        }
      }
      return response({ status: 'skipped' });
    }

    const appUrl = getAppUrl(request.url);
    let notificationId: string;
    if (previous) {
      const { data: claimed, error: claimError } = await admin
        .from('customer_tracking_notifications')
        .update({
          status: 'sending',
          attempt_count: previous.attempt_count + 1,
          last_error: null,
          recipient_email: order.client_email.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', previous.id)
        .eq('status', 'failed')
        .eq('updated_at', previous.updated_at)
        .select('id')
        .maybeSingle();
      if (claimError) {
        console.error('Unable to claim customer update retry:', claimError.message);
        return response({ error: 'Unable to start the customer update.' }, 500);
      }
      if (!claimed) return response({ error: 'This customer update has already been claimed.' }, 409);
      notificationId = claimed.id;
    } else {
      const { data: created, error: createError } = await admin
        .from('customer_tracking_notifications')
        .insert({
          order_id: order.id,
          assignment_id: assignment.id,
          event: parsed.data.event,
          status: 'sending',
          attempt_count: 1,
          recipient_email: order.client_email.trim(),
        })
        .select('id')
        .maybeSingle();
      if (createError) {
        if (createError.code === '23505') return response({ error: 'This customer update is already being processed.' }, 409);
        console.error('Unable to create customer update status:', createError.message);
        return response({ error: 'Unable to prepare the customer update.' }, 500);
      }
      if (!created) return response({ error: 'Unable to prepare the customer update.' }, 500);
      notificationId = created.id;
    }

    const token = randomBytes(32).toString('base64url');
    const trackingUrl = new URL(`/track/${token}`, appUrl).toString();
    const { error: linkError } = await admin
      .from('customer_tracking_links')
      .insert({
        order_id: order.id,
        token_hash: createHash('sha256').update(token).digest('hex'),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: userId,
      });
    if (linkError) {
      console.error('Unable to create customer tracking link for update:', linkError.message);
      await updateNotification(admin, notificationId, { status: 'failed', last_error: 'Unable to create a tracking link.' });
      return response({ error: 'Unable to create a tracking link for the customer update.' }, 500);
    }

    let providerMessageId: string;
    try {
      providerMessageId = await sendCustomerTrackingUpdateEmail({
        to: order.client_email.trim(),
        orderNumber: order.order_number,
        customerName: order.client_name,
        event: parsed.data.event,
        trackingUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email provider request failed.';
      await updateNotification(admin, notificationId, { status: 'failed', last_error: message });
      console.error('Customer tracking status email failed:', message);
      return response({ error: 'The customer update could not be emailed. Check the email configuration.' }, 502);
    }

    await updateNotification(admin, notificationId, {
      status: 'sent',
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      last_error: null,
    });
    return response({ status: 'sent' });
  } catch (error) {
    console.error('Customer tracking notification failed:', error instanceof Error ? error.message : 'Unknown server error');
    return response({ error: 'Unable to process the customer update.' }, 500);
  }
}
