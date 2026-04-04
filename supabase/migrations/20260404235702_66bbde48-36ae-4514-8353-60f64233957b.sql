
-- SALE_ITEMS: add UPDATE and DELETE policies
CREATE POLICY "Shop owners can update sale items" ON public.sale_items FOR UPDATE TO authenticated
USING (sale_id IN (SELECT id FROM public.sales WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())));

CREATE POLICY "Shop owners can delete sale items" ON public.sale_items FOR DELETE TO authenticated
USING (sale_id IN (SELECT id FROM public.sales WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())));

-- PURCHASE_ITEMS: add UPDATE and DELETE policies
CREATE POLICY "Shop owners can update purchase items" ON public.purchase_items FOR UPDATE TO authenticated
USING (purchase_id IN (SELECT id FROM public.purchases WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())));

CREATE POLICY "Shop owners can delete purchase items" ON public.purchase_items FOR DELETE TO authenticated
USING (purchase_id IN (SELECT id FROM public.purchases WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())));

-- QUOTATION_ITEMS: add UPDATE and DELETE policies
CREATE POLICY "Shop owners can update quotation items" ON public.quotation_items FOR UPDATE TO authenticated
USING (quotation_id IN (SELECT id FROM public.quotations WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())));

CREATE POLICY "Shop owners can delete quotation items" ON public.quotation_items FOR DELETE TO authenticated
USING (quotation_id IN (SELECT id FROM public.quotations WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())));

-- PROFILES: prevent role self-escalation with a trigger
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_profile_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();
