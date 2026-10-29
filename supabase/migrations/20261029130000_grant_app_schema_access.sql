GRANT USAGE ON SCHEMA public TO authenticated, service_role;

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
TO service_role;

GRANT SELECT ON TABLE
  public.active_orders_with_assignments,
  public.personnel_performance
TO service_role;