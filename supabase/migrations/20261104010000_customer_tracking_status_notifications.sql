CREATE TABLE public.customer_tracking_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.order_assignments(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('assigned', 'in_transit')),
  recipient_email TEXT,
  status TEXT NOT NULL CHECK (status IN ('sending', 'sent', 'failed', 'skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  provider_message_id TEXT,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, event)
);

CREATE INDEX idx_customer_tracking_notifications_status
  ON public.customer_tracking_notifications(status, updated_at DESC);

ALTER TABLE public.customer_tracking_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.customer_tracking_notifications FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.customer_tracking_notifications TO service_role;
