CREATE OR REPLACE FUNCTION public.set_my_driver_availability(p_status public.personnel_status)
RETURNS public.delivery_personnel
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  driver_record public.delivery_personnel;
BEGIN
  IF auth.uid() IS NULL
    OR public.current_user_role() IS DISTINCT FROM 'delivery_personnel'::public.user_role THEN
    RAISE EXCEPTION 'Only an authenticated delivery driver can update their availability';
  END IF;

  IF p_status IS NULL OR p_status NOT IN (
    'available'::public.personnel_status,
    'on_break'::public.personnel_status,
    'off_duty'::public.personnel_status
  ) THEN
    RAISE EXCEPTION 'Select available, on break, or off duty';
  END IF;

  SELECT *
  INTO driver_record
  FROM public.delivery_personnel
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No driver profile is linked to this account';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.order_assignments
    WHERE personnel_id = driver_record.id
      AND status IN ('pending', 'accepted', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'Finish or decline your active assignment before changing availability';
  END IF;

  UPDATE public.delivery_personnel
  SET current_status = p_status,
      updated_at = NOW()
  WHERE id = driver_record.id
  RETURNING * INTO driver_record;

  RETURN driver_record;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_driver_availability(public.personnel_status)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_driver_availability(public.personnel_status)
TO authenticated;
