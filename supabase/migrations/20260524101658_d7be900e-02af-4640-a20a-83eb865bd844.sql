CREATE OR REPLACE FUNCTION public.user_is_shop_staff(_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shop_users
    WHERE shop_id = _shop_id AND user_id = auth.uid() AND is_active = true
  )
$$;

DROP POLICY IF EXISTS "Staff can view shops they are assigned to" ON public.shops;

CREATE POLICY "Staff can view shops they are assigned to"
ON public.shops FOR SELECT
TO authenticated
USING (public.user_is_shop_staff(id));