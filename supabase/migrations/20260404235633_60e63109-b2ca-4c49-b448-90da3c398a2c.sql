
-- SALE_ITEMS: scope through sales -> shop access
DROP POLICY IF EXISTS "Users can view sale items for accessible sales" ON public.sale_items;
CREATE POLICY "Users can view sale items for accessible sales" ON public.sale_items FOR SELECT TO authenticated
USING (sale_id IN (SELECT id FROM public.sales WHERE public.user_has_shop_access(shop_id)));

DROP POLICY IF EXISTS "Users can create sale items" ON public.sale_items;
CREATE POLICY "Users can create sale items" ON public.sale_items FOR INSERT TO authenticated
WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE public.user_has_shop_access(shop_id)));

-- PURCHASE_ITEMS: scope through purchases -> shop access
DROP POLICY IF EXISTS "Users can view purchase items" ON public.purchase_items;
CREATE POLICY "Users can view purchase items" ON public.purchase_items FOR SELECT TO authenticated
USING (purchase_id IN (SELECT id FROM public.purchases WHERE public.user_has_shop_access(shop_id)));

DROP POLICY IF EXISTS "Users can create purchase items" ON public.purchase_items;
CREATE POLICY "Users can create purchase items" ON public.purchase_items FOR INSERT TO authenticated
WITH CHECK (purchase_id IN (SELECT id FROM public.purchases WHERE public.user_has_shop_access(shop_id)));

-- QUOTATION_ITEMS: scope through quotations -> shop access
DROP POLICY IF EXISTS "Users can view quotation items" ON public.quotation_items;
CREATE POLICY "Users can view quotation items" ON public.quotation_items FOR SELECT TO authenticated
USING (quotation_id IN (SELECT id FROM public.quotations WHERE public.user_has_shop_access(shop_id)));

DROP POLICY IF EXISTS "Users can create quotation items" ON public.quotation_items;
CREATE POLICY "Users can create quotation items" ON public.quotation_items FOR INSERT TO authenticated
WITH CHECK (quotation_id IN (SELECT id FROM public.quotations WHERE public.user_has_shop_access(shop_id)));
