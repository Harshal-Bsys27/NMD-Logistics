ALTER TABLE public.orders
  ADD COLUMN delivery_email_consent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.delivery_proofs
  ADD COLUMN recipient_signature_path TEXT,
  ADD COLUMN signature_exception_reason TEXT
    CHECK (signature_exception_reason IS NULL OR char_length(btrim(signature_exception_reason)) BETWEEN 10 AND 300);

CREATE TABLE public.delivery_feedback_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL UNIQUE REFERENCES public.order_assignments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  recipient_email TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  provider_message_id TEXT,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_feedback_notifications_status
  ON public.delivery_feedback_notifications(status, updated_at DESC);

ALTER TABLE public.delivery_feedback_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.delivery_feedback_notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.delivery_feedback_notifications TO authenticated;
GRANT ALL ON public.delivery_feedback_notifications TO service_role;

CREATE POLICY delivery_feedback_notifications_staff_read
ON public.delivery_feedback_notifications FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'));

DROP FUNCTION public.complete_assignment_with_proof(UUID, TEXT, TEXT, TEXT);

CREATE FUNCTION public.complete_assignment_with_proof(
  p_assignment_id UUID,
  p_recipient_name TEXT,
  p_notes TEXT DEFAULT NULL,
  p_photo_path TEXT DEFAULT NULL,
  p_recipient_signature_path TEXT DEFAULT NULL,
  p_signature_exception_reason TEXT DEFAULT NULL
)
RETURNS public.delivery_proofs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
DECLARE
  target_order_id UUID;
  target_personnel_id UUID;
  target_status public.assignment_status;
  target_email TEXT;
  target_email_consent BOOLEAN;
  saved_proof public.delivery_proofs;
BEGIN
  IF public.current_user_role() IS DISTINCT FROM 'delivery_personnel' THEN
    RAISE EXCEPTION 'Only the assigned delivery personnel can submit proof of delivery';
  END IF;

  IF p_recipient_name IS NULL OR char_length(btrim(p_recipient_name)) NOT BETWEEN 1 AND 120 THEN
    RAISE EXCEPTION 'Recipient name must be between 1 and 120 characters';
  END IF;

  IF p_notes IS NOT NULL AND char_length(p_notes) > 1000 THEN
    RAISE EXCEPTION 'Delivery notes must be 1000 characters or fewer';
  END IF;

  IF p_recipient_signature_path IS NULL THEN
    IF p_signature_exception_reason IS NULL
      OR char_length(btrim(p_signature_exception_reason)) NOT BETWEEN 10 AND 300 THEN
      RAISE EXCEPTION 'A recipient signature is required, or provide a reason of 10 to 300 characters';
    END IF;
    IF p_photo_path IS NULL THEN
      RAISE EXCEPTION 'A proof photo is required when the recipient cannot sign';
    END IF;
  ELSIF p_signature_exception_reason IS NOT NULL THEN
    RAISE EXCEPTION 'Do not provide a signature exception reason when a recipient signature is recorded';
  END IF;

  SELECT assignment.order_id, assignment.personnel_id, assignment.status,
         orders.client_email, orders.delivery_email_consent
  INTO target_order_id, target_personnel_id, target_status, target_email, target_email_consent
  FROM public.order_assignments AS assignment
  JOIN public.delivery_personnel AS personnel
    ON personnel.id = assignment.personnel_id
  JOIN public.orders
    ON orders.id = assignment.order_id
  WHERE assignment.id = p_assignment_id
    AND personnel.user_id = (SELECT auth.uid())
  FOR UPDATE OF assignment;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found for the signed-in delivery personnel';
  END IF;

  IF target_status IS DISTINCT FROM 'in_progress' THEN
    RAISE EXCEPTION 'Only an in-progress assignment can be completed';
  END IF;

  IF p_photo_path IS NOT NULL AND (
    p_photo_path !~ ('^' || p_assignment_id::TEXT || '/[A-Za-z0-9._-]+$')
    OR NOT EXISTS (
      SELECT 1
      FROM storage.objects AS stored_object
      WHERE stored_object.bucket_id = 'delivery-proofs'
        AND stored_object.name = p_photo_path
    )
  ) THEN
    RAISE EXCEPTION 'The proof photo is invalid or unavailable';
  END IF;

  IF p_recipient_signature_path IS NOT NULL AND (
    p_recipient_signature_path !~ ('^' || p_assignment_id::TEXT || '/signature-[A-Za-z0-9._-]+\.png$')
    OR NOT EXISTS (
      SELECT 1
      FROM storage.objects AS stored_object
      WHERE stored_object.bucket_id = 'delivery-proofs'
        AND stored_object.name = p_recipient_signature_path
    )
  ) THEN
    RAISE EXCEPTION 'The recipient signature is invalid or unavailable';
  END IF;

  INSERT INTO public.delivery_proofs (
    assignment_id,
    order_id,
    personnel_id,
    recipient_name,
    notes,
    photo_path,
    recipient_signature_path,
    signature_exception_reason,
    created_by
  )
  VALUES (
    p_assignment_id,
    target_order_id,
    target_personnel_id,
    btrim(p_recipient_name),
    NULLIF(btrim(p_notes), ''),
    p_photo_path,
    p_recipient_signature_path,
    NULLIF(btrim(p_signature_exception_reason), ''),
    (SELECT auth.uid())
  )
  RETURNING * INTO saved_proof;

  UPDATE public.order_assignments
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_assignment_id;

  UPDATE public.orders
  SET actual_delivery_time = saved_proof.delivered_at,
      updated_at = NOW()
  WHERE id = target_order_id;

  INSERT INTO public.delivery_feedback_notifications (
    assignment_id,
    order_id,
    recipient_email,
    status,
    last_error
  )
  VALUES (
    p_assignment_id,
    target_order_id,
    CASE WHEN target_email_consent THEN NULLIF(btrim(target_email), '') ELSE NULL END,
    CASE
      WHEN target_email_consent AND NULLIF(btrim(target_email), '') IS NOT NULL THEN 'pending'
      ELSE 'skipped'
    END,
    CASE
      WHEN NOT target_email_consent THEN 'Customer email consent was not recorded.'
      WHEN NULLIF(btrim(target_email), '') IS NULL THEN 'No customer email was provided.'
      ELSE NULL
    END
  );

  RETURN saved_proof;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_assignment_with_proof(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_assignment_with_proof(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
