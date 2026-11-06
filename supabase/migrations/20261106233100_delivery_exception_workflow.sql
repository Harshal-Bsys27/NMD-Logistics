CREATE TABLE public.delivery_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL UNIQUE REFERENCES public.order_assignments(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.delivery_personnel(id),
  reason TEXT NOT NULL CHECK (reason IN (
    'customer_unavailable',
    'address_issue',
    'customer_refused',
    'access_blocked',
    'vehicle_issue',
    'package_issue',
    'other'
  )),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
  photo_path TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolution_action TEXT CHECK (resolution_action IS NULL OR resolution_action = 'reopen_for_dispatch'),
  resolution_note TEXT CHECK (resolution_note IS NULL OR char_length(resolution_note) <= 1000),
  reported_by UUID NOT NULL REFERENCES public.users(id),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_exceptions_status_reported_at
  ON public.delivery_exceptions(status, reported_at DESC);
CREATE INDEX idx_delivery_exceptions_order_id
  ON public.delivery_exceptions(order_id);

ALTER TABLE public.delivery_exceptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.delivery_exceptions FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.delivery_exceptions TO authenticated;
GRANT ALL ON TABLE public.delivery_exceptions TO service_role;

CREATE POLICY delivery_exceptions_read_authorized
ON public.delivery_exceptions FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('admin', 'supervisor')
  OR EXISTS (
    SELECT 1
    FROM public.delivery_personnel AS personnel
    WHERE personnel.id = delivery_exceptions.personnel_id
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.enforce_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF public.current_user_role() IN ('admin', 'supervisor')
    AND (
      (OLD.status = 'draft' AND NEW.status = 'pending')
      OR (
        OLD.status = 'failed'
        AND NEW.status = 'pending'
        AND EXISTS (
          SELECT 1
          FROM public.delivery_exceptions AS exception
          WHERE exception.order_id = OLD.id
            AND exception.status = 'resolved'
            AND exception.resolution_action = 'reopen_for_dispatch'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.delivery_exceptions AS exception
          WHERE exception.order_id = OLD.id
            AND exception.status = 'open'
        )
      )
      OR (
        NEW.status IN ('failed', 'cancelled')
        AND OLD.status NOT IN ('delivered', 'failed', 'cancelled')
      )
    ) THEN
    IF NEW.status IN ('failed', 'cancelled') AND EXISTS (
      SELECT 1
      FROM public.order_assignments
      WHERE order_id = OLD.id
        AND status IN ('pending', 'accepted', 'in_progress')
    ) THEN
      RAISE EXCEPTION 'Cancel or reject the active assignment before closing this order';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Orders can only be released from draft, reopened after a resolved delivery issue, or marked failed/cancelled directly';
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_driver_assignment_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  related_order_status public.order_status;
  related_driver_status public.personnel_status;
  user_role public.user_role;
BEGIN
  user_role := public.current_user_role();

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'New assignments must start in pending status';
    END IF;

    SELECT status
    INTO related_order_status
    FROM public.orders
    WHERE id = NEW.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'The order does not exist';
    END IF;

    IF related_order_status NOT IN ('pending', 'confirmed') THEN
      RAISE EXCEPTION 'Only pending or confirmed orders can be assigned';
    END IF;

    SELECT current_status
    INTO related_driver_status
    FROM public.delivery_personnel
    WHERE id = NEW.personnel_id
    FOR UPDATE;

    IF NOT FOUND OR related_driver_status <> 'available' THEN
      RAISE EXCEPTION 'The selected driver is not available';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.order_assignments
      WHERE order_id = NEW.order_id
        AND status IN ('pending', 'accepted', 'in_progress')
    ) THEN
      RAISE EXCEPTION 'This order already has an active assignment';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.order_assignments
      WHERE personnel_id = NEW.personnel_id
        AND status IN ('pending', 'accepted', 'in_progress')
    ) THEN
      RAISE EXCEPTION 'The selected driver already has an active assignment';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.order_id IS DISTINCT FROM OLD.order_id
    OR NEW.personnel_id IS DISTINCT FROM OLD.personnel_id
    OR NEW.assigned_by IS DISTINCT FROM OLD.assigned_by
    OR NEW.assigned_at IS DISTINCT FROM OLD.assigned_at
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'An assignment cannot be moved to another order or driver';
  END IF;

  IF user_role IS DISTINCT FROM 'admin'
    AND user_role IS DISTINCT FROM 'supervisor'
    AND (
      NEW.estimated_duration_minutes IS DISTINCT FROM OLD.estimated_duration_minutes
      OR NEW.actual_duration_minutes IS DISTINCT FROM OLD.actual_duration_minutes
      OR NEW.notes IS DISTINCT FROM OLD.notes
      OR (
        NEW.updated_at IS DISTINCT FROM OLD.updated_at
        AND NOT (
          (OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected', 'cancelled'))
          OR (OLD.status = 'accepted' AND NEW.status IN ('in_progress', 'rejected', 'cancelled'))
          OR (OLD.status = 'in_progress' AND NEW.status IN ('completed', 'failed'))
        )
      )
      OR (
        NEW.accepted_at IS DISTINCT FROM OLD.accepted_at
        AND NOT (OLD.status = 'pending' AND NEW.status = 'accepted' AND NEW.accepted_at IS NOT NULL)
      )
      OR (
        NEW.started_at IS DISTINCT FROM OLD.started_at
        AND NOT (OLD.status = 'accepted' AND NEW.status = 'in_progress' AND NEW.started_at IS NOT NULL)
      )
      OR (
        NEW.completed_at IS DISTINCT FROM OLD.completed_at
        AND NOT (OLD.status = 'in_progress' AND NEW.status = 'completed' AND NEW.completed_at IS NOT NULL)
      )
    ) THEN
    RAISE EXCEPTION 'Drivers may only update their assignment status';
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected', 'cancelled'))
    OR (OLD.status = 'accepted' AND NEW.status IN ('in_progress', 'rejected', 'cancelled'))
    OR (OLD.status = 'in_progress' AND NEW.status = 'completed')
    OR (
      OLD.status = 'in_progress'
      AND NEW.status = 'failed'
      AND EXISTS (
        SELECT 1
        FROM public.delivery_exceptions AS exception
        WHERE exception.assignment_id = OLD.id
      )
    )
  ) THEN
    RAISE EXCEPTION 'Invalid assignment status transition';
  END IF;

  NEW.updated_at := NOW();
  IF NEW.status = 'accepted' THEN
    NEW.accepted_at := NOW();
  ELSIF NEW.status = 'in_progress' THEN
    NEW.started_at := NOW();
  ELSIF NEW.status = 'completed' THEN
    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_order_status_with_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_status public.order_status;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_status := 'assigned';
  ELSIF NEW.status IN ('accepted', 'in_progress', 'completed', 'failed') THEN
    target_status := CASE NEW.status
      WHEN 'accepted' THEN 'assigned'::public.order_status
      WHEN 'in_progress' THEN 'in_transit'::public.order_status
      WHEN 'completed' THEN 'delivered'::public.order_status
      ELSE 'failed'::public.order_status
    END;
  ELSIF NEW.status IN ('rejected', 'cancelled') THEN
    target_status := 'pending';
  ELSE
    RETURN NEW;
  END IF;

  UPDATE public.orders
  SET status = target_status,
      updated_at = NOW(),
      actual_delivery_time = CASE
        WHEN NEW.status = 'completed' THEN COALESCE(NEW.completed_at, NOW())
        ELSE actual_delivery_time
      END
  WHERE id = NEW.order_id
    AND (
      (TG_OP = 'INSERT' AND status IN ('pending', 'confirmed'))
      OR (NEW.status IN ('rejected', 'cancelled') AND status = 'assigned')
      OR (NEW.status IN ('accepted', 'in_progress', 'completed', 'failed') AND status IS DISTINCT FROM target_status)
    );

  IF NEW.status = 'in_progress' THEN
    UPDATE public.delivery_personnel
    SET current_status = 'on_delivery',
        updated_at = NOW()
    WHERE id = NEW.personnel_id;
  ELSIF NEW.status = 'completed' THEN
    UPDATE public.delivery_personnel
    SET current_status = 'available',
        total_deliveries_completed = COALESCE(total_deliveries_completed, 0) + 1,
        updated_at = NOW()
    WHERE id = NEW.personnel_id;
  ELSIF NEW.status IN ('rejected', 'cancelled', 'failed') THEN
    UPDATE public.delivery_personnel
    SET current_status = 'available',
        updated_at = NOW()
    WHERE id = NEW.personnel_id
      AND current_status = 'on_delivery'
      AND NOT EXISTS (
        SELECT 1
        FROM public.order_assignments AS active_assignment
        WHERE active_assignment.personnel_id = NEW.personnel_id
          AND active_assignment.id <> NEW.id
          AND active_assignment.status = 'in_progress'
      );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.report_delivery_exception(
  p_assignment_id UUID,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL,
  p_photo_path TEXT DEFAULT NULL
)
RETURNS public.delivery_exceptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
DECLARE
  target_order_id UUID;
  target_personnel_id UUID;
  target_status public.assignment_status;
  saved_exception public.delivery_exceptions;
BEGIN
  IF public.current_user_role() IS DISTINCT FROM 'delivery_personnel' THEN
    RAISE EXCEPTION 'Only the assigned delivery personnel can report a delivery issue';
  END IF;

  IF p_reason NOT IN (
    'customer_unavailable',
    'address_issue',
    'customer_refused',
    'access_blocked',
    'vehicle_issue',
    'package_issue',
    'other'
  ) THEN
    RAISE EXCEPTION 'Choose a valid delivery issue reason';
  END IF;

  IF p_notes IS NOT NULL AND char_length(p_notes) > 1000 THEN
    RAISE EXCEPTION 'Delivery issue notes must be 1000 characters or fewer';
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
    RAISE EXCEPTION 'Only an in-progress assignment can report a delivery issue';
  END IF;

  IF p_photo_path IS NOT NULL AND (
    p_photo_path !~ ('^' || p_assignment_id::TEXT || '/exception-[A-Za-z0-9._-]+$')
    OR NOT EXISTS (
      SELECT 1
      FROM storage.objects AS stored_object
      WHERE stored_object.bucket_id = 'delivery-proofs'
        AND stored_object.name = p_photo_path
    )
  ) THEN
    RAISE EXCEPTION 'The issue photo is invalid or unavailable';
  END IF;

  INSERT INTO public.delivery_exceptions (
    order_id,
    assignment_id,
    personnel_id,
    reason,
    notes,
    photo_path,
    reported_by
  )
  VALUES (
    target_order_id,
    p_assignment_id,
    target_personnel_id,
    p_reason,
    NULLIF(btrim(p_notes), ''),
    p_photo_path,
    (SELECT auth.uid())
  )
  RETURNING * INTO saved_exception;

  UPDATE public.order_assignments
  SET status = 'failed',
      updated_at = NOW()
  WHERE id = p_assignment_id;

  RETURN saved_exception;
END;
$$;

REVOKE ALL ON FUNCTION public.report_delivery_exception(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_delivery_exception(UUID, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_delivery_exception(
  p_exception_id UUID,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS public.delivery_exceptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_exception public.delivery_exceptions;
BEGIN
  IF public.current_user_role() IS DISTINCT FROM 'admin'
    AND public.current_user_role() IS DISTINCT FROM 'supervisor' THEN
    RAISE EXCEPTION 'Only administrators and supervisors can resolve delivery issues';
  END IF;

  IF p_resolution_note IS NOT NULL AND char_length(p_resolution_note) > 1000 THEN
    RAISE EXCEPTION 'Resolution notes must be 1000 characters or fewer';
  END IF;

  SELECT *
  INTO target_exception
  FROM public.delivery_exceptions
  WHERE id = p_exception_id
  FOR UPDATE;

  IF NOT FOUND OR target_exception.status <> 'open' THEN
    RAISE EXCEPTION 'This delivery issue is no longer open';
  END IF;

  UPDATE public.delivery_exceptions
  SET status = 'resolved',
      resolution_action = 'reopen_for_dispatch',
      resolution_note = NULLIF(btrim(p_resolution_note), ''),
      resolved_by = (SELECT auth.uid()),
      resolved_at = NOW(),
      updated_at = NOW()
  WHERE id = p_exception_id
  RETURNING * INTO target_exception;

  UPDATE public.orders
  SET status = 'pending',
      updated_at = NOW()
  WHERE id = target_exception.order_id;

  RETURN target_exception;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_delivery_exception(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_delivery_exception(UUID, TEXT) TO authenticated;

ALTER TABLE public.customer_tracking_notifications
  DROP CONSTRAINT IF EXISTS customer_tracking_notifications_event_check;
ALTER TABLE public.customer_tracking_notifications
  ADD CONSTRAINT customer_tracking_notifications_event_check
  CHECK (event IN ('assigned', 'in_transit', 'delivery_failed'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'delivery_exceptions'
    ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_exceptions;
  END IF;
END;
$$;
