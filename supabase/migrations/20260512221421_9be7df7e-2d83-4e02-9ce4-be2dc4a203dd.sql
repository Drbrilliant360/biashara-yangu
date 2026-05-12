
DROP POLICY IF EXISTS "Super admins update sub events" ON public.subscription_events;
CREATE POLICY "Super admins update sub events" ON public.subscription_events
  FOR UPDATE TO authenticated USING (public.is_super_admin());
