CREATE TABLE public.driver_availability_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.delivery_personnel(id) ON DELETE CASCADE,
  previous_status public.personnel_status NOT NULL,
  new_status public.personnel_status NOT NULL,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX driver_availability_history_driver_changed_idx
  ON public.driver_availability_history (driver_id, changed_at DESC);

ALTER TABLE public.driver_availability_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.driver_availability_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.driver_availability_history TO authenticated;

CREATE POLICY driver_availability_history_read_own
ON public.driver_availability_history FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_personnel AS personnel
    WHERE personnel.id = driver_id
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY driver_availability_history_staff_read
ON public.driver_availability_history FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'));

CREATE OR REPLACE FUNCTION public.record_driver_availability_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO public.driver_availability_history (
      driver_id,
      previous_status,
      new_status,
      changed_by
    )
    VALUES (
      NEW.id,
      OLD.current_status,
      NEW.current_status,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.record_driver_availability_change()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER record_driver_availability_change
  AFTER UPDATE OF current_status ON public.delivery_personnel
  FOR EACH ROW
  WHEN (OLD.current_status IS DISTINCT FROM NEW.current_status)
  EXECUTE FUNCTION public.record_driver_availability_change();
