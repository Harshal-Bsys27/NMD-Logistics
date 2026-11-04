import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppUrl } from '@/lib/app-url';
import { sendCustomerDeliveryFeedbackEmail } from '@/lib/email/customer-feedback';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const requestSchema = z.object({
  assignment_id: z.string().uuid(),
  retry: z.boolean().optional().default(false),
});

async function setNotificationFailure(
  admin: ReturnType<typeof getSupabaseAdmin>,
  notificationId: string,
  message: string,
) {
  const { error } = await admin
    .from('delivery_feedback_notifications')
    .update({ status: 'failed', last_error: message, updated_at: new Date().toISOString() })
    .eq('id', notificationId);
  if (error) {
    console.error('Unable to record delivery email failure:', error.message);
    throw new Error('The email failed and its notification status could not be saved.');
  }
}

async function markNotificationSent(admin: ReturnType<typeof getSupabaseAdmin>, notificationId: string) {
  const { error } = await admin
    .from('delivery_feedback_notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId);
  if (error) {
    console.error('Unable to reconcile submitted customer feedback:', error.message);
    throw new Error('Feedback was submitted, but the notification status could not be updated.');
  }
}

async function setNotificationSkipped(
  admin: ReturnType<typeof getSupabaseAdmin>,
  notificationId: string,
  message: string,
) {
  const { error } = await admin
    .from('delivery_feedback_notifications')
    .update({
      status: 'skipped',
      recipient_email: null,
      last_error: message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId);
  if (error) {
    console.error('Unable to record skipped customer email:', error.message);
    throw new Error('Customer email was skipped, but its notification status could not be saved.');
  }
}

async function getActorId(request: Request, admin: ReturnType<typeof getSupabaseAdmin>) {
  const authorization = request.headers.get('authorization');
  if (authorization) {
    const bearerToken = /^Bearer\s+(\S+)$/i.exec(authorization)?.[1];
    if (!bearerToken) return null;
    const { data, error } = await admin.auth.getUser(bearerToken);
    return error || !data.user ? null : data.user.id;
  }

  const sessionClient = await createSupabaseServerClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  return error || !user ? null : user.id;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid notification request.' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid assignment ID is required.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  try {
    const userId = await getActorId(request, admin);
    if (!userId) return NextResponse.json({ error: 'Sign in to send the delivery email.' }, { status: 401 });

    const { data: actor, error: actorError } = await admin
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .maybeSingle();
    if (actorError) {
      console.error('Unable to verify delivery email permissions:', actorError.message);
      return NextResponse.json({ error: 'Unable to verify your permissions.' }, { status: 500 });
    }
    if (!actor || actor.status !== 'active') {
      return NextResponse.json({ error: 'Your account is not active.' }, { status: 403 });
    }
    const isStaff = actor.role === 'admin' || actor.role === 'supervisor';
    if (!isStaff && actor.role !== 'delivery_personnel') {
      return NextResponse.json({ error: 'You are not allowed to send delivery emails.' }, { status: 403 });
    }
    if (parsed.data.retry && !isStaff) {
      return NextResponse.json({ error: 'Only administrators and supervisors can retry email delivery.' }, { status: 403 });
    }

    const { data: assignment, error: assignmentError } = await admin
      .from('order_assignments')
      .select('id, order_id, personnel_id, status')
      .eq('id', parsed.data.assignment_id)
      .maybeSingle();
    if (assignmentError) {
      console.error('Unable to load assignment for delivery email:', assignmentError.message);
      return NextResponse.json({ error: 'Unable to verify this delivery.' }, { status: 500 });
    }
    if (!assignment || assignment.status !== 'completed') {
      return NextResponse.json({ error: 'Delivery emails are available only after delivery is completed.' }, { status: 409 });
    }

    if (actor.role === 'delivery_personnel') {
      const { data: personnel, error: personnelError } = await admin
        .from('delivery_personnel')
        .select('user_id')
        .eq('id', assignment.personnel_id)
        .maybeSingle();
      if (personnelError) {
        console.error('Unable to verify delivery email assignment:', personnelError.message);
        return NextResponse.json({ error: 'Unable to verify your assignment.' }, { status: 500 });
      }
      if (personnel?.user_id !== userId) {
        return NextResponse.json({ error: 'You can send an email only for your own delivery.' }, { status: 403 });
      }
    }

    const [{ data: order, error: orderError }, { data: notification, error: notificationError }, { data: proof, error: proofError }] = await Promise.all([
      admin
        .from('orders')
        .select('order_number, client_name, client_email, delivery_email_consent')
        .eq('id', assignment.order_id)
        .maybeSingle(),
      admin
        .from('delivery_feedback_notifications')
        .select('id, status, attempt_count, updated_at')
        .eq('assignment_id', assignment.id)
        .maybeSingle(),
      admin
        .from('delivery_proofs')
        .select('assignment_id')
        .eq('assignment_id', assignment.id)
        .maybeSingle(),
    ]);

    if (orderError || notificationError || proofError) {
      console.error('Unable to load delivery notification details:', orderError?.message, notificationError?.message, proofError?.message);
      return NextResponse.json({ error: 'Unable to load delivery notification details.' }, { status: 500 });
    }
    if (!proof) return NextResponse.json({ error: 'Proof of delivery is required before emailing the customer.' }, { status: 409 });
    if (!notification || !order) {
      return NextResponse.json({ error: 'The delivery notification record is missing. Refresh the delivery record before retrying.' }, { status: 409 });
    }
    if (!order.delivery_email_consent || !order.client_email?.trim()) {
      await setNotificationSkipped(
        admin,
        notification.id,
        !order.delivery_email_consent ? 'Customer email consent is no longer recorded.' : 'No customer email is available.',
      );
      return NextResponse.json({ status: 'skipped', error: 'No email was sent because customer consent or email is missing.' });
    }
    if (notification.status === 'skipped') {
      return NextResponse.json({ status: 'skipped', error: 'This delivery was not approved for customer email.' });
    }
    if (notification.status === 'sent' && !parsed.data.retry) {
      return NextResponse.json({ status: 'sent' });
    }

    const [{ data: existingRequest, error: feedbackRequestError }, { data: existingFeedback, error: feedbackError }] = await Promise.all([
      admin
      .from('delivery_feedback_requests')
      .select('id, submitted_at')
      .eq('assignment_id', assignment.id)
      .maybeSingle(),
      admin
        .from('delivery_feedback')
        .select('assignment_id')
        .eq('assignment_id', assignment.id)
        .maybeSingle(),
    ]);
    if (feedbackRequestError || feedbackError) {
      console.error('Unable to check delivery feedback before sending:', feedbackRequestError?.message, feedbackError?.message);
      return NextResponse.json({ error: 'Unable to check whether the customer already submitted feedback.' }, { status: 500 });
    }
    if (existingRequest?.submitted_at || existingFeedback) {
      await markNotificationSent(admin, notification.id);
      return NextResponse.json({ status: 'sent', feedback_submitted: true });
    }

    const staleSending = notification.status === 'sending'
      && Date.now() - new Date(notification.updated_at).getTime() > 10 * 60 * 1000;
    if (notification.status === 'sending' && !staleSending) {
      return NextResponse.json({ error: 'This delivery email is already being processed. Try again in a few minutes.' }, { status: 409 });
    }

    const nextAttempt = notification.attempt_count + 1;
    const { data: claimed, error: claimError } = await admin
      .from('delivery_feedback_notifications')
      .update({
        status: 'sending',
        attempt_count: nextAttempt,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', notification.id)
      .eq('updated_at', notification.updated_at)
      .in('status', ['pending', 'failed', ...(parsed.data.retry ? ['sent'] : []), ...(parsed.data.retry && staleSending ? ['sending'] : [])])
      .select('id')
      .maybeSingle();
    if (claimError) {
      console.error('Unable to claim delivery email notification:', claimError.message);
      return NextResponse.json({ error: 'Unable to start the delivery email.' }, { status: 500 });
    }
    if (!claimed) {
      return NextResponse.json({ error: 'This delivery email is already being processed. Refresh the status before retrying.' }, { status: 409 });
    }

    const smtpUsername = process.env.GMAIL_SMTP_USER?.trim();
    const smtpPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
    if (!smtpUsername || !smtpPassword) {
      const message = 'Gmail email is not configured. Set GMAIL_SMTP_USER and GMAIL_APP_PASSWORD on the server.';
      await setNotificationFailure(admin, notification.id, message);
      return NextResponse.json({ status: 'failed', error: message }, { status: 503 });
    }

    let appUrl: URL;
    try {
      appUrl = getAppUrl(request.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The public application URL is invalid.';
      await setNotificationFailure(admin, notification.id, message);
      return NextResponse.json({ status: 'failed', error: message }, { status: 500 });
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const requestData = {
      token_hash: tokenHash,
      expires_at: expiresAt,
      submitted_at: null,
      created_by: userId,
    };
    let saveRequestError: { message: string } | null = null;
    if (existingRequest) {
      const { data: updatedRequest, error } = await admin
        .from('delivery_feedback_requests')
        .update(requestData)
        .eq('id', existingRequest.id)
        .is('submitted_at', null)
        .select('id')
        .maybeSingle();
      saveRequestError = error;
      if (!error && !updatedRequest) {
        const { data: submittedFeedback, error: submittedFeedbackError } = await admin
          .from('delivery_feedback')
          .select('assignment_id')
          .eq('assignment_id', assignment.id)
          .maybeSingle();
        if (submittedFeedbackError) {
          console.error('Unable to verify feedback during notification retry:', submittedFeedbackError.message);
          await setNotificationFailure(admin, notification.id, 'Could not verify customer feedback before retry.');
          return NextResponse.json({ status: 'failed', error: 'Could not verify customer feedback before retry.' }, { status: 500 });
        }
        if (submittedFeedback) {
          await markNotificationSent(admin, notification.id);
          return NextResponse.json({ status: 'sent', feedback_submitted: true });
        }
        await setNotificationFailure(admin, notification.id, 'Feedback request changed before the email could be retried.');
        return NextResponse.json({ status: 'failed', error: 'The feedback request changed. Refresh and retry the email.' }, { status: 409 });
      }
    } else {
      const { error } = await admin
        .from('delivery_feedback_requests')
        .insert({
        assignment_id: assignment.id,
        order_id: assignment.order_id,
          ...requestData,
        });
      saveRequestError = error;
    }
    if (saveRequestError) {
      console.error('Unable to create customer feedback request:', saveRequestError.message);
      await setNotificationFailure(admin, notification.id, 'Could not create the feedback request.');
      return NextResponse.json({ status: 'failed', error: 'Could not create the customer feedback request.' }, { status: 500 });
    }

    const feedbackUrl = new URL(`/feedback/${token}`, appUrl).toString();
    const trackingToken = randomBytes(32).toString('base64url');
    const trackingTokenHash = createHash('sha256').update(trackingToken).digest('hex');
    const { error: trackingLinkError } = await admin
      .from('customer_tracking_links')
      .insert({
        order_id: assignment.order_id,
        token_hash: trackingTokenHash,
        expires_at: expiresAt,
        created_by: userId,
      });
    if (trackingLinkError) {
      console.error('Unable to create tracking link for delivery confirmation:', trackingLinkError.message);
      await setNotificationFailure(admin, notification.id, 'Could not create the delivery tracking link.');
      return NextResponse.json({ status: 'failed', error: 'Could not create the delivery tracking link.' }, { status: 500 });
    }
    const trackingUrl = new URL(`/track/${trackingToken}`, appUrl).toString();
    let providerMessageId: string | null = null;
    try {
      providerMessageId = await sendCustomerDeliveryFeedbackEmail({
        to: order.client_email,
        orderNumber: order.order_number,
        customerName: order.client_name,
        feedbackUrl,
        trackingUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gmail SMTP request failed.';
      await setNotificationFailure(admin, notification.id, message);
      console.error('Customer delivery email failed:', message);
      return NextResponse.json({ status: 'failed', error: 'The customer email could not be sent. An administrator can retry it.' }, { status: 502 });
    }

    const { error: updateError } = await admin
      .from('delivery_feedback_notifications')
      .update({
        status: 'sent',
        provider_message_id: providerMessageId,
        last_error: null,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', notification.id);
    if (updateError) {
      console.error('Email was sent but notification status could not be saved:', updateError.message);
      return NextResponse.json({ status: 'failed', error: 'The email was sent, but its status could not be saved. Check the email before retrying.' }, { status: 500 });
    }
    return NextResponse.json({ status: 'sent' });
  } catch (error) {
    console.error('Customer delivery notification failed:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({ error: 'Unable to process the delivery email.' }, { status: 500 });
  }
}
