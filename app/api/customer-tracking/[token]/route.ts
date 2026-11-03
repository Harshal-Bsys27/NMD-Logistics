import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
type RouteContext = { params: Promise<{ token: string }> };

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = await params;
  if (!tokenPattern.test(token)) {
    return response({ error: 'This tracking link is invalid or expired.' }, 404);
  }

  try {
    const admin = getSupabaseAdmin();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const { data: link, error: linkError } = await admin
      .from('customer_tracking_links')
      .select('order_id, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (linkError) {
      console.error('Unable to look up customer tracking link:', linkError.message);
      return response({ error: 'Unable to load tracking details.' }, 500);
    }
    if (!link || link.revoked_at || new Date(link.expires_at).getTime() <= Date.now()) {
      return response({ error: 'This tracking link is invalid or expired.' }, 404);
    }

    const [{ data: order, error: orderError }, { data: assignments, error: assignmentError }, { data: history, error: historyError }] = await Promise.all([
      admin
        .from('orders')
        .select('order_number, status, created_at, actual_delivery_time')
        .eq('id', link.order_id)
        .maybeSingle(),
      admin
        .from('order_assignments')
        .select('assigned_at, started_at, completed_at')
        .eq('order_id', link.order_id)
        .order('assigned_at', { ascending: true }),
      admin
        .from('delivery_status_history')
        .select('new_status, created_at')
        .eq('order_id', link.order_id)
        .order('created_at', { ascending: true }),
    ]);

    if (orderError || assignmentError || historyError) {
      console.error('Unable to load customer tracking milestones:', orderError?.message || assignmentError?.message || historyError?.message);
      return response({ error: 'Unable to load tracking details.' }, 500);
    }
    if (!order) return response({ error: 'This tracking link is no longer available.' }, 404);

    const firstStatusTime = (statuses: string[]) => history?.find((item) => statuses.includes(item.new_status))?.created_at ?? null;
    const firstAssignment = assignments?.[0];
    const assignedAt = firstStatusTime(['assigned']) ?? firstAssignment?.assigned_at ?? null;
    const inTransitAt = firstStatusTime(['picked_up', 'in_transit'])
      ?? assignments?.find((item) => item.started_at)?.started_at
      ?? null;
    const deliveredAt = order.actual_delivery_time
      ?? firstStatusTime(['delivered'])
      ?? assignments?.find((item) => item.completed_at)?.completed_at
      ?? null;
    const assigned = !!assignedAt || ['assigned', 'picked_up', 'in_transit', 'delivered'].includes(order.status);
    const inTransit = !!inTransitAt || ['picked_up', 'in_transit', 'delivered'].includes(order.status);
    const delivered = !!deliveredAt || order.status === 'delivered';
    const currentMilestone = ['draft', 'pending', 'confirmed'].includes(order.status)
      ? 'received'
      : order.status === 'assigned'
        ? 'assigned'
        : ['picked_up', 'in_transit'].includes(order.status)
          ? 'in_transit'
          : order.status === 'delivered'
            ? 'delivered'
            : null;
    const milestones = [
      { key: 'received', label: 'Order received', occurred_at: order.created_at, complete: true },
      { key: 'assigned', label: 'Driver assigned', occurred_at: assignedAt, complete: assigned },
      { key: 'in_transit', label: 'On the way', occurred_at: inTransitAt, complete: inTransit },
      { key: 'delivered', label: 'Delivered', occurred_at: deliveredAt, complete: delivered },
    ];

    return response({
      order_number: order.order_number,
      status: order.status,
      current_milestone: currentMilestone,
      expires_at: link.expires_at,
      milestones,
    });
  } catch (error) {
    console.error('Customer tracking lookup failed:', error instanceof Error ? error.message : 'Unknown server error');
    return response({ error: 'Unable to load tracking details.' }, 500);
  }
}
