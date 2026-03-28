
CREATE OR REPLACE FUNCTION public.user_has_shop_access(shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.shop_users WHERE shop_users.shop_id = $1 AND user_id = auth.uid() AND is_active = true
  )
$$;

DROP POLICY IF EXISTS "Users can view shops they own or work at" ON public.shops;
CREATE POLICY "Users can view shops they own or work at"
  ON public.shops FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR public.user_has_shop_access(id));

DROP POLICY IF EXISTS "Shop owners and users can view shop_users" ON public.shop_users;
CREATE POLICY "Shop owners and users can view shop_users"
  ON public.shop_users FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Shop owners can manage shop_users" ON public.shop_users;
CREATE POLICY "Shop owners can manage shop_users"
  ON public.shop_users FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Shop owners can update shop_users" ON public.shop_users;
CREATE POLICY "Shop owners can update shop_users"
  ON public.shop_users FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Shop owners can delete shop_users" ON public.shop_users;
CREATE POLICY "Shop owners can delete shop_users"
  ON public.shop_users FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));
