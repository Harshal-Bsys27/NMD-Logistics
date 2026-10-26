CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role
  FROM public.users
  WHERE id = (SELECT auth.uid())
    AND status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_non_admin_user_privilege_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
    AND auth.role() IS DISTINCT FROM 'service_role'
    AND public.current_user_role() IS DISTINCT FROM 'admin'
    AND (
      OLD.id IS DISTINCT FROM NEW.id
      OR OLD.email IS DISTINCT FROM NEW.email
      OR OLD.role IS DISTINCT FROM NEW.role
      OR OLD.status IS DISTINCT FROM NEW.status
    ) THEN
    RAISE EXCEPTION 'Only an administrator may change user access fields';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_non_admin_user_privilege_changes() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER prevent_non_admin_user_privilege_changes
  BEFORE UPDATE OF id, email, role, status ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_non_admin_user_privilege_changes();

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.users,
  public.delivery_personnel,
  public.orders,
  public.order_assignments,
  public.delivery_status_history,
  public.reports,
  public.analytics_metrics,
  public.settings,
  public.audit_log
TO authenticated;

REVOKE ALL ON TABLE
  public.users,
  public.delivery_personnel,
  public.orders,
  public.order_assignments,
  public.delivery_status_history,
  public.reports,
  public.analytics_metrics,
  public.settings,
  public.audit_log
FROM anon;

CREATE POLICY users_admin_manage
ON public.users FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY users_staff_read
ON public.users FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY users_read_own_profile
ON public.users FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY users_update_own_profile
ON public.users FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY personnel_staff_manage
ON public.delivery_personnel FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'))
WITH CHECK (public.current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY personnel_read_own_record
ON public.delivery_personnel FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY orders_staff_manage
ON public.orders FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'))
WITH CHECK (public.current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY orders_drivers_read_assigned
ON public.orders FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_assignments AS assignment
    JOIN public.delivery_personnel AS personnel
      ON personnel.id = assignment.personnel_id
    WHERE assignment.order_id = orders.id
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY assignments_staff_manage
ON public.order_assignments FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'))
WITH CHECK (public.current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY assignments_drivers_read_own
ON public.order_assignments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_personnel AS personnel
    WHERE personnel.id = order_assignments.personnel_id
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY status_history_staff_read
ON public.delivery_status_history FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY status_history_drivers_read_assigned
ON public.delivery_status_history FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_assignments AS assignment
    JOIN public.delivery_personnel AS personnel
      ON personnel.id = assignment.personnel_id
    WHERE assignment.order_id = delivery_status_history.order_id
      AND personnel.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY reports_staff_manage
ON public.reports FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'))
WITH CHECK (public.current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY analytics_staff_read
ON public.analytics_metrics FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY settings_staff_read
ON public.settings FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY settings_admin_manage
ON public.settings FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY audit_admin_read
ON public.audit_log FOR SELECT TO authenticated
USING (public.current_user_role() = 'admin');

ALTER VIEW public.active_orders_with_assignments SET (security_invoker = true);
ALTER VIEW public.personnel_performance SET (security_invoker = true);
REVOKE ALL ON TABLE public.active_orders_with_assignments, public.personnel_performance FROM anon;
GRANT SELECT ON TABLE public.active_orders_with_assignments, public.personnel_performance TO authenticated;