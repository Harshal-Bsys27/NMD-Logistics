ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'confirmed';

CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.delivery_status_history (
      order_id,
      previous_status,
      new_status,
      updated_by,
      notes
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Order status changed'
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.record_order_status_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER record_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.record_order_status_change();

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
  ELSIF NEW.status = 'accepted' THEN
    target_status := 'assigned';
  ELSIF NEW.status = 'in_progress' THEN
    target_status := 'in_transit';
  ELSIF NEW.status = 'completed' THEN
    target_status := 'delivered';
  ELSE
    RETURN NEW;
  END IF;

  UPDATE public.orders
  SET status = target_status,
      updated_at = NOW()
  WHERE id = NEW.order_id
    AND status IS DISTINCT FROM target_status;

  IF NEW.status = 'in_progress' THEN
    UPDATE public.delivery_personnel
    SET current_status = 'on_delivery',
        updated_at = NOW()
    WHERE id = NEW.personnel_id;
  ELSIF NEW.status IN ('completed', 'rejected', 'cancelled') THEN
    UPDATE public.delivery_personnel AS personnel
    SET current_status = 'available',
        updated_at = NOW()
    WHERE personnel.id = NEW.personnel_id
      AND personnel.current_status = 'on_delivery'
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

REVOKE ALL ON FUNCTION public.sync_order_status_with_assignment() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER sync_order_status_on_assignment_create
  AFTER INSERT ON public.order_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_status_with_assignment();

CREATE TRIGGER sync_order_status_on_assignment_update
  AFTER UPDATE OF status ON public.order_assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_order_status_with_assignment();

CREATE POLICY assignments_drivers_update_own
ON public.order_assignments FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_personnel AS personnel
    WHERE personnel.id = order_assignments.personnel_id
      AND personnel.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.delivery_personnel AS personnel
    WHERE personnel.id = order_assignments.personnel_id
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.prevent_driver_assignment_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.current_user_role() IN ('admin', 'supervisor') THEN
    RETURN NEW;
  END IF;

  IF NEW.order_id IS DISTINCT FROM OLD.order_id
    OR NEW.personnel_id IS DISTINCT FROM OLD.personnel_id
    OR NEW.assigned_by IS DISTINCT FROM OLD.assigned_by
    OR NEW.assigned_at IS DISTINCT FROM OLD.assigned_at
    OR NEW.estimated_duration_minutes IS DISTINCT FROM OLD.estimated_duration_minutes
    OR NEW.actual_duration_minutes IS DISTINCT FROM OLD.actual_duration_minutes
    OR NEW.notes IS DISTINCT FROM OLD.notes
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR (NEW.accepted_at IS DISTINCT FROM OLD.accepted_at AND NOT (OLD.status = 'pending' AND NEW.status = 'accepted' AND NEW.accepted_at IS NOT NULL))
    OR (NEW.started_at IS DISTINCT FROM OLD.started_at AND NOT (OLD.status = 'accepted' AND NEW.status = 'in_progress' AND NEW.started_at IS NOT NULL))
    OR (NEW.completed_at IS DISTINCT FROM OLD.completed_at AND NOT (OLD.status = 'in_progress' AND NEW.status = 'completed' AND NEW.completed_at IS NOT NULL)) THEN
    RAISE EXCEPTION 'Drivers may only update their assignment status';
  END IF;

  IF NOT (
    (OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected'))
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

REVOKE ALL ON FUNCTION public.prevent_driver_assignment_reassignment() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER prevent_driver_assignment_reassignment
  BEFORE UPDATE ON public.order_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_driver_assignment_reassignment();
