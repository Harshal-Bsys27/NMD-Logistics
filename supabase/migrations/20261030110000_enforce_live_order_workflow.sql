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

  RAISE EXCEPTION 'Orders can only be released from draft or marked failed/cancelled directly';
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_order_status_transition() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_order_status_transition ON public.orders;
CREATE TRIGGER enforce_order_status_transition
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.enforce_order_status_transition();

CREATE OR REPLACE FUNCTION public.enforce_driver_assignment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.current_status = 'available' AND EXISTS (
    SELECT 1
    FROM public.order_assignments
    WHERE personnel_id = NEW.id
      AND status IN ('pending', 'accepted', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'A driver with an active assignment cannot be marked available';
  END IF;

  IF NEW.current_status = 'on_delivery' AND NOT EXISTS (
    SELECT 1
    FROM public.order_assignments
    WHERE personnel_id = NEW.id
      AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'A driver can only be marked on delivery after starting an assignment';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_driver_assignment_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_driver_assignment_status ON public.delivery_personnel;
CREATE TRIGGER enforce_driver_assignment_status
  BEFORE UPDATE OF current_status ON public.delivery_personnel
  FOR EACH ROW
  WHEN (OLD.current_status IS DISTINCT FROM NEW.current_status)
  EXECUTE FUNCTION public.enforce_driver_assignment_status();

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
          OR (OLD.status = 'in_progress' AND NEW.status = 'completed')
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
  ELSIF NEW.status IN ('accepted', 'in_progress', 'completed') THEN
    target_status := CASE NEW.status
      WHEN 'accepted' THEN 'assigned'::public.order_status
      WHEN 'in_progress' THEN 'in_transit'::public.order_status
      ELSE 'delivered'::public.order_status
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
      OR (NEW.status IN ('accepted', 'in_progress', 'completed') AND status IS DISTINCT FROM target_status)
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
  ELSIF NEW.status IN ('rejected', 'cancelled') THEN
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

DO $$
DECLARE
  realtime_table TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH realtime_table IN ARRAY ARRAY['orders', 'order_assignments', 'delivery_personnel']
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = realtime_table
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', realtime_table);
      END IF;
    END LOOP;
  END IF;
END;
$$;
