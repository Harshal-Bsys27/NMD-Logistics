DROP POLICY IF EXISTS assignments_drivers_update_own ON public.order_assignments;

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
