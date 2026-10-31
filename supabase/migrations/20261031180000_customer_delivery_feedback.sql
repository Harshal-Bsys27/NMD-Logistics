CREATE TABLE public.delivery_feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL UNIQUE REFERENCES public.delivery_proofs(assignment_id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.delivery_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.delivery_feedback_requests(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.order_assignments(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.delivery_personnel(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT CHECK (review IS NULL OR char_length(review) <= 1000),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_feedback_order_id ON public.delivery_feedback(order_id);
CREATE INDEX idx_delivery_feedback_personnel_id ON public.delivery_feedback(personnel_id);
ALTER TABLE public.delivery_feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_feedback ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.delivery_feedback_requests, public.delivery_feedback FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.delivery_feedback TO authenticated;

CREATE POLICY delivery_feedback_staff_read
ON public.delivery_feedback FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY delivery_feedback_driver_read_own
ON public.delivery_feedback FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_personnel AS personnel
    WHERE personnel.id = delivery_feedback.personnel_id
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.submit_customer_delivery_feedback(
  p_token_hash TEXT,
  p_rating SMALLINT,
  p_review TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_request_id UUID;
  target_order_id UUID;
  target_assignment_id UUID;
  target_personnel_id UUID;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Feedback link is invalid or expired';
  END IF;

  IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  IF p_review IS NOT NULL AND char_length(p_review) > 1000 THEN
    RAISE EXCEPTION 'Review must be 1000 characters or fewer';
  END IF;

  UPDATE public.delivery_feedback_requests AS request
  SET submitted_at = NOW()
  WHERE request.token_hash = p_token_hash
    AND request.expires_at > NOW()
    AND request.submitted_at IS NULL
  RETURNING request.id, request.order_id, request.assignment_id
  INTO target_request_id, target_order_id, target_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feedback link is invalid, expired, or already used';
  END IF;

  SELECT proof.personnel_id
  INTO target_personnel_id
  FROM public.delivery_proofs AS proof
  WHERE proof.assignment_id = target_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery proof could not be found';
  END IF;

  INSERT INTO public.delivery_feedback (
    request_id,
    order_id,
    assignment_id,
    personnel_id,
    rating,
    review
  )
  VALUES (
    target_request_id,
    target_order_id,
    target_assignment_id,
    target_personnel_id,
    p_rating,
    NULLIF(btrim(p_review), '')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_customer_delivery_feedback(TEXT, SMALLINT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_customer_delivery_feedback(TEXT, SMALLINT, TEXT) TO service_role;
