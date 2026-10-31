import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional().default(''),
});

type RouteContext = { params: Promise<{ token: string }> };

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = await params;
  if (!tokenPattern.test(token)) {
    return NextResponse.json({ error: 'This feedback link is invalid or expired.' }, { status: 404 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: feedbackRequest, error } = await admin
      .from('delivery_feedback_requests')
      .select('assignment_id, order_id, expires_at, submitted_at')
      .eq('token_hash', hashToken(token))
      .maybeSingle();

    if (error) {
      console.error('Unable to load public customer feedback request:', error.message);
      return NextResponse.json({ error: 'Unable to load this feedback form.' }, { status: 500 });
    }
    if (!feedbackRequest) {
      return NextResponse.json({ error: 'This feedback link is invalid or expired.' }, { status: 404 });
    }
    if (feedbackRequest.submitted_at) {
      return NextResponse.json({ submitted: true });
    }
    if (new Date(feedbackRequest.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'This feedback link has expired.' }, { status: 410 });
    }

    const [{ data: order, error: orderError }, { data: proof, error: proofError }] = await Promise.all([
      admin.from('orders').select('order_number').eq('id', feedbackRequest.order_id).maybeSingle(),
      admin.from('delivery_proofs').select('delivered_at').eq('assignment_id', feedbackRequest.assignment_id).maybeSingle(),
    ]);

    if (orderError || proofError) {
      console.error('Unable to load safe delivery details for feedback:', orderError?.message || proofError?.message);
      return NextResponse.json({ error: 'Unable to load this feedback form.' }, { status: 500 });
    }
    if (!order || !proof) {
      return NextResponse.json({ error: 'This feedback link is no longer available.' }, { status: 404 });
    }

    return NextResponse.json({
      submitted: false,
      order_number: order.order_number,
      delivered_at: proof.delivered_at,
      expires_at: feedbackRequest.expires_at,
    });
  } catch (error) {
    console.error('Public customer feedback lookup failed:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({ error: 'Unable to load this feedback form.' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { token } = await params;
  if (!tokenPattern.test(token)) {
    return NextResponse.json({ error: 'This feedback link is invalid or expired.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid feedback submission.' }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Choose a rating from 1 to 5 and keep the review within 1000 characters.' }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.rpc('submit_customer_delivery_feedback', {
      p_token_hash: hashToken(token),
      p_rating: parsed.data.rating,
      p_review: parsed.data.review.trim() || null,
    });

    if (error) {
      const alreadyUsed = error.message.includes('invalid, expired, or already used');
      return NextResponse.json(
        { error: alreadyUsed ? 'This feedback link has expired or has already been used.' : 'Unable to save your feedback.' },
        { status: alreadyUsed ? 409 : 500 }
      );
    }

    return NextResponse.json({ submitted: true });
  } catch (error) {
    console.error('Customer feedback submission failed:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({ error: 'Unable to save your feedback right now.' }, { status: 500 });
  }
}
