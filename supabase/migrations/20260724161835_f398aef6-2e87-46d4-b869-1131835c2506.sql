
-- 1) Remove self-update on subscriptions (users could grant themselves paid status)
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- 2) Revoke direct EXECUTE on internal trigger/helper SECURITY DEFINER functions.
-- Functions used inside RLS policies (is_super_admin, user_has_shop_access, user_is_shop_staff)
-- must remain executable by authenticated so RLS can evaluate them.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_subscription_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_stock_after_purchase() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_stock_after_sale() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
