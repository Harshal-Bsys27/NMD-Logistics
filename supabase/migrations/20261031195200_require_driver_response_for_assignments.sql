CREATE OR REPLACE FUNCTION public.require_assigned_driver_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (OLD.status = 'pending' AND NEW.status = 'accepted')
    OR (OLD.status = 'accepted' AND NEW.status = 'in_progress') THEN
    IF public.current_user_role() IS DISTINCT FROM 'delivery_personnel'
      OR NOT EXISTS (
        SELECT 1
        FROM public.delivery_personnel AS personnel
        WHERE personnel.id = NEW.personnel_id
          AND personnel.user_id = (SELECT auth.uid())
      ) THEN
      RAISE EXCEPTION 'Only the assigned delivery personnel can accept or start this assignment';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.require_assigned_driver_response() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER require_assigned_driver_response
  BEFORE UPDATE OF status ON public.order_assignments
  FOR EACH ROW
  WHEN (
    (OLD.status = 'pending' AND NEW.status = 'accepted')
    OR (OLD.status = 'accepted' AND NEW.status = 'in_progress')
  )
  EXECUTE FUNCTION public.require_assigned_driver_response();
