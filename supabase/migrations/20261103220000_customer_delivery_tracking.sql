CREATE TABLE public.customer_tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_customer_tracking_links_order
  ON public.customer_tracking_links(order_id, created_at DESC);
CREATE INDEX idx_customer_tracking_links_expiry
  ON public.customer_tracking_links(expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE public.customer_tracking_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.customer_tracking_links FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.customer_tracking_links TO service_role;
