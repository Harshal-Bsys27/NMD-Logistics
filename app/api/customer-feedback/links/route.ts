import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppUrl } from '@/lib/app-url';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const requestSchema = z.object({
  assignment_id: z.string().uuid(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid feedback-link request.' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid assignment ID is required.' }, { status: 400 });
  }

  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in to generate a customer feedback link.' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: actor, error: actorError } = await admin
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (actorError) {
      console.error('Unable to verify feedback-link permissions:', actorError.message);
      return NextResponse.json({ error: 'Unable to verify your permissions.' }, { status: 500 });
    }
    if (!actor || actor.status !== 'active') {
      return NextResponse.json({ error: 'Your account is not active.' }, { status: 403 });
    }

    const { data: assignment, error: assignmentError } = await admin
      .from('order_assignments')
      .select('id, order_id, personnel_id, status')
      .eq('id', parsed.data.assignment_id)
      .maybeSingle();

    if (assignmentError) {
      console.error('Unable to verify feedback-link assignment:', assignmentError.message);
      return NextResponse.json({ error: 'Unable to verify this assignment.' }, { status: 500 });
    }
    if (!assignment || assignment.status !== 'completed') {
      return NextResponse.json({ error: 'Feedback links are available only after delivery is completed.' }, { status: 409 });
    }

    if (actor.role === 'delivery_personnel') {
      const { data: personnel, error: personnelError } = await admin
        .from('delivery_personnel')
        .select('user_id')
        .eq('id', assignment.personnel_id)
        .maybeSingle();

      if (personnelError) {
        console.error('Unable to verify assigned driver for feedback link:', personnelError.message);
        return NextResponse.json({ error: 'Unable to verify your assignment.' }, { status: 500 });
      }
      if (personnel?.user_id !== user.id) {
        return NextResponse.json({ error: 'You can generate a link only for your own delivery.' }, { status: 403 });
      }
    } else if (actor.role !== 'admin' && actor.role !== 'supervisor') {
      return NextResponse.json({ error: 'You are not allowed to generate feedback links.' }, { status: 403 });
    }

    const { data: proof, error: proofError } = await admin
      .from('delivery_proofs')
      .select('assignment_id')
      .eq('assignment_id', assignment.id)
      .maybeSingle();

    if (proofError) {
      console.error('Unable to verify proof before generating feedback link:', proofError.message);
      return NextResponse.json({ error: 'Unable to verify proof of delivery.' }, { status: 500 });
    }
    if (!proof) {
      return NextResponse.json({ error: 'A proof of delivery is required before requesting feedback.' }, { status: 409 });
    }

    const { data: existingRequest, error: existingRequestError } = await admin
      .from('delivery_feedback_requests')
      .select('submitted_at')
      .eq('assignment_id', assignment.id)
      .maybeSingle();

    if (existingRequestError) {
      console.error('Unable to check existing delivery feedback:', existingRequestError.message);
      return NextResponse.json({ error: 'Unable to check whether feedback has already been submitted.' }, { status: 500 });
    }
    if (existingRequest?.submitted_at) {
      return NextResponse.json({ error: 'Customer feedback has already been submitted for this delivery.' }, { status: 409 });
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: saveError } = await admin
      .from('delivery_feedback_requests')
      .upsert({
        assignment_id: assignment.id,
        order_id: assignment.order_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        submitted_at: null,
        created_by: user.id,
      }, { onConflict: 'assignment_id' });

    if (saveError) {
      console.error('Unable to save delivery feedback link:', saveError.message);
      return NextResponse.json({ error: 'Unable to generate a feedback link.' }, { status: 500 });
    }

    const linkUrl = new URL(`/feedback/${token}`, getAppUrl(request.url)).toString();
    return NextResponse.json({ url: linkUrl, expires_at: expiresAt }, { status: 201 });
  } catch (error) {
    console.error('Feedback-link generation failed:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({ error: 'Unable to generate a customer feedback link.' }, { status: 500 });
  }
}
