
-- SHOPS: fix INSERT, UPDATE, DELETE to authenticated
DROP POLICY IF EXISTS "Owners can create shops" ON public.shops;
CREATE POLICY "Owners can create shops" ON public.shops FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their shops" ON public.shops;
CREATE POLICY "Owners can update their shops" ON public.shops FOR UPDATE TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their shops" ON public.shops;
CREATE POLICY "Owners can delete their shops" ON public.shops FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- PROFILES: fix INSERT and SELECT to authenticated
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- EXPENSES: all policies to authenticated
DROP POLICY IF EXISTS "Shop users can view expenses" ON public.expenses;
CREATE POLICY "Shop users can view expenses" ON public.expenses FOR SELECT TO authenticated
USING (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners and managers can create expenses" ON public.expenses;
CREATE POLICY "Shop owners and managers can create expenses" ON public.expenses FOR INSERT TO authenticated
WITH CHECK (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners and managers can update expenses" ON public.expenses;
CREATE POLICY "Shop owners and managers can update expenses" ON public.expenses FOR UPDATE TO authenticated
USING (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners can delete expenses" ON public.expenses;
CREATE POLICY "Shop owners can delete expenses" ON public.expenses FOR DELETE TO authenticated
USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- SALES: all policies to authenticated
DROP POLICY IF EXISTS "Shop users can view sales" ON public.sales;
CREATE POLICY "Shop users can view sales" ON public.sales FOR SELECT TO authenticated
USING (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop users can create sales" ON public.sales;
CREATE POLICY "Shop users can create sales" ON public.sales FOR INSERT TO authenticated
WITH CHECK (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners can update sales" ON public.sales;
CREATE POLICY "Shop owners can update sales" ON public.sales FOR UPDATE TO authenticated
USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Shop owners can delete sales" ON public.sales;
CREATE POLICY "Shop owners can delete sales" ON public.sales FOR DELETE TO authenticated
USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- SALE_ITEMS: all policies to authenticated
DROP POLICY IF EXISTS "Users can view sale items for accessible sales" ON public.sale_items;
CREATE POLICY "Users can view sale items for accessible sales" ON public.sale_items FOR SELECT TO authenticated
USING (sale_id IN (SELECT id FROM public.sales));

DROP POLICY IF EXISTS "Users can create sale items" ON public.sale_items;
CREATE POLICY "Users can create sale items" ON public.sale_items FOR INSERT TO authenticated
WITH CHECK (sale_id IN (SELECT id FROM public.sales));

-- PURCHASES: all policies to authenticated
DROP POLICY IF EXISTS "Shop users can view purchases" ON public.purchases;
CREATE POLICY "Shop users can view purchases" ON public.purchases FOR SELECT TO authenticated
USING (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners and managers can create purchases" ON public.purchases;
CREATE POLICY "Shop owners and managers can create purchases" ON public.purchases FOR INSERT TO authenticated
WITH CHECK (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners and managers can update purchases" ON public.purchases;
CREATE POLICY "Shop owners and managers can update purchases" ON public.purchases FOR UPDATE TO authenticated
USING (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners can delete purchases" ON public.purchases;
CREATE POLICY "Shop owners can delete purchases" ON public.purchases FOR DELETE TO authenticated
USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- PURCHASE_ITEMS: all policies to authenticated
DROP POLICY IF EXISTS "Users can view purchase items" ON public.purchase_items;
CREATE POLICY "Users can view purchase items" ON public.purchase_items FOR SELECT TO authenticated
USING (purchase_id IN (SELECT id FROM public.purchases));

DROP POLICY IF EXISTS "Users can create purchase items" ON public.purchase_items;
CREATE POLICY "Users can create purchase items" ON public.purchase_items FOR INSERT TO authenticated
WITH CHECK (purchase_id IN (SELECT id FROM public.purchases));

-- QUOTATIONS: all policies to authenticated
DROP POLICY IF EXISTS "Shop users can view quotations" ON public.quotations;
CREATE POLICY "Shop users can view quotations" ON public.quotations FOR SELECT TO authenticated
USING (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop users can create quotations" ON public.quotations;
CREATE POLICY "Shop users can create quotations" ON public.quotations FOR INSERT TO authenticated
WITH CHECK (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop users can update quotations" ON public.quotations;
CREATE POLICY "Shop users can update quotations" ON public.quotations FOR UPDATE TO authenticated
USING (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners can delete quotations" ON public.quotations;
CREATE POLICY "Shop owners can delete quotations" ON public.quotations FOR DELETE TO authenticated
USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- QUOTATION_ITEMS: all policies to authenticated
DROP POLICY IF EXISTS "Users can view quotation items" ON public.quotation_items;
CREATE POLICY "Users can view quotation items" ON public.quotation_items FOR SELECT TO authenticated
USING (quotation_id IN (SELECT id FROM public.quotations));

DROP POLICY IF EXISTS "Users can create quotation items" ON public.quotation_items;
CREATE POLICY "Users can create quotation items" ON public.quotation_items FOR INSERT TO authenticated
WITH CHECK (quotation_id IN (SELECT id FROM public.quotations));

-- PRODUCTS: all policies to authenticated
DROP POLICY IF EXISTS "Shop users can view products" ON public.products;
CREATE POLICY "Shop users can view products" ON public.products FOR SELECT TO authenticated
USING (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners and managers can create products" ON public.products;
CREATE POLICY "Shop owners and managers can create products" ON public.products FOR INSERT TO authenticated
WITH CHECK (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners and managers can update products" ON public.products;
CREATE POLICY "Shop owners and managers can update products" ON public.products FOR UPDATE TO authenticated
USING (public.user_has_shop_access(shop_id));

DROP POLICY IF EXISTS "Shop owners can delete products" ON public.products;
CREATE POLICY "Shop owners can delete products" ON public.products FOR DELETE TO authenticated
USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
