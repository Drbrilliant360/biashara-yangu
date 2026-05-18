-- Tighten shop visibility: split into clear, separate policies
DROP POLICY IF EXISTS "Users can view shops they own or work at" ON public.shops;

CREATE POLICY "Owners can view their own shops"
  ON public.shops FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Staff can view shops they are assigned to"
  ON public.shops FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_users
      WHERE shop_users.shop_id = shops.id
        AND shop_users.user_id = auth.uid()
        AND shop_users.is_active = true
    )
  );