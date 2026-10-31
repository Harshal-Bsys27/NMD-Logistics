CREATE TABLE public.delivery_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL UNIQUE REFERENCES public.order_assignments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.delivery_personnel(id),
  recipient_name TEXT NOT NULL CHECK (char_length(btrim(recipient_name)) BETWEEN 1 AND 120),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
  photo_path TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_proofs_order_id ON public.delivery_proofs(order_id);
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.delivery_proofs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.delivery_proofs TO authenticated;

CREATE POLICY delivery_proofs_read_authorized
ON public.delivery_proofs FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('admin', 'supervisor')
  OR EXISTS (
    SELECT 1
    FROM public.order_assignments AS assignment
    JOIN public.delivery_personnel AS personnel
      ON personnel.id = assignment.personnel_id
    WHERE assignment.id = delivery_proofs.assignment_id
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.prevent_assignment_completion_without_proof()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'completed'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NOT EXISTS (
      SELECT 1
      FROM public.delivery_proofs AS proof
      WHERE proof.assignment_id = NEW.id
    ) THEN
    RAISE EXCEPTION 'Proof of delivery is required before completing an assignment';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_assignment_completion_without_proof() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER prevent_assignment_completion_without_proof
  BEFORE UPDATE OF status ON public.order_assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.prevent_assignment_completion_without_proof();

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'delivery-proofs',
  'delivery-proofs',
  false,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY delivery_proofs_photo_read_authorized
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'delivery-proofs'
  AND (
    public.current_user_role() IN ('admin', 'supervisor')
    OR EXISTS (
      SELECT 1
      FROM public.order_assignments AS assignment
      JOIN public.delivery_personnel AS personnel
        ON personnel.id = assignment.personnel_id
      WHERE assignment.id::TEXT = (storage.foldername(name))[1]
        AND personnel.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY delivery_proofs_photo_insert_assigned_driver
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'delivery-proofs'
  AND public.current_user_role() = 'delivery_personnel'
  AND EXISTS (
    SELECT 1
    FROM public.order_assignments AS assignment
    JOIN public.delivery_personnel AS personnel
      ON personnel.id = assignment.personnel_id
    WHERE assignment.id::TEXT = (storage.foldername(name))[1]
      AND assignment.status = 'in_progress'
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY delivery_proofs_photo_delete_assigned_driver
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'delivery-proofs'
  AND EXISTS (
    SELECT 1
    FROM public.order_assignments AS assignment
    JOIN public.delivery_personnel AS personnel
      ON personnel.id = assignment.personnel_id
    WHERE assignment.id::TEXT = (storage.foldername(name))[1]
      AND assignment.status = 'in_progress'
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.complete_assignment_with_proof(
  p_assignment_id UUID,
  p_recipient_name TEXT,
  p_notes TEXT DEFAULT NULL,
  p_photo_path TEXT DEFAULT NULL
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

  SELECT assignment.order_id, assignment.personnel_id, assignment.status
  INTO target_order_id, target_personnel_id, target_status
  FROM public.order_assignments AS assignment
  JOIN public.delivery_personnel AS personnel
    ON personnel.id = assignment.personnel_id
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

  INSERT INTO public.delivery_proofs (
    assignment_id,
    order_id,
    personnel_id,
    recipient_name,
    notes,
    photo_path,
    created_by
  )
  VALUES (
    p_assignment_id,
    target_order_id,
    target_personnel_id,
    btrim(p_recipient_name),
    NULLIF(btrim(p_notes), ''),
    p_photo_path,
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

  RETURN saved_proof;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_assignment_with_proof(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_assignment_with_proof(UUID, TEXT, TEXT, TEXT) TO authenticated;
