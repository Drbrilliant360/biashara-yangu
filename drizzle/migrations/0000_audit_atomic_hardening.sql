-- Hardening: tenant-safe stock triggers, audit logging, atomic sale/purchase/quotation
-- creation, value constraints, last-super-admin protection, and indexes.
-- Idempotent: safe to run more than once.

-- ============================================================================
-- 1. Stock triggers
--    * Fix: sale_items / purchase_items each had TWO triggers calling the same
--      function (stock changed twice per row). Drop all, create exactly one.
--    * Fix: the SECURITY DEFINER function updated ANY product by id, so a user
--      could change another shop's stock. Now the product must belong to the
--      same shop as the sale/purchase.
--    * Fix: stock could go negative. Sales now fail with a clear message.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_shop uuid;
BEGIN
  SELECT shop_id INTO v_shop FROM public.sales WHERE id = NEW.sale_id;

  UPDATE public.products
     SET stock_quantity = stock_quantity - NEW.quantity
   WHERE id = NEW.product_id
     AND shop_id = v_shop
     AND stock_quantity >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough stock for "%" (or the product does not belong to this shop)', NEW.product_name
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_stock_after_purchase()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_shop uuid;
BEGIN
  SELECT shop_id INTO v_shop FROM public.purchases WHERE id = NEW.purchase_id;

  UPDATE public.products
     SET stock_quantity = stock_quantity + NEW.quantity
   WHERE id = NEW.product_id
     AND shop_id = v_shop;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product "%" does not belong to this shop', NEW.product_name
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_sale_item_created ON public.sale_items;
DROP TRIGGER IF EXISTS update_stock_after_sale_trigger ON public.sale_items;
DROP TRIGGER IF EXISTS trg_stock_after_sale ON public.sale_items;
CREATE TRIGGER trg_stock_after_sale
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_sale();

DROP TRIGGER IF EXISTS on_purchase_item_created ON public.purchase_items;
DROP TRIGGER IF EXISTS update_stock_after_purchase_trigger ON public.purchase_items;
DROP TRIGGER IF EXISTS trg_stock_after_purchase ON public.purchase_items;
CREATE TRIGGER trg_stock_after_purchase
  AFTER INSERT ON public.purchase_items
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_purchase();

REVOKE EXECUTE ON FUNCTION public.update_stock_after_sale() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_stock_after_purchase() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 2. Data integrity: reject negative / zero values on new writes.
--    NOT VALID = existing rows are not scanned (cannot fail on old data);
--    all new inserts and updates are checked.
-- ============================================================================
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_prices_nonneg;
ALTER TABLE public.products ADD CONSTRAINT products_prices_nonneg
  CHECK (buying_price >= 0 AND selling_price >= 0 AND min_stock_level >= 0) NOT VALID;

ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_values_valid;
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_values_valid
  CHECK (quantity > 0 AND unit_price >= 0 AND discount >= 0 AND total >= 0) NOT VALID;

ALTER TABLE public.purchase_items DROP CONSTRAINT IF EXISTS purchase_items_values_valid;
ALTER TABLE public.purchase_items ADD CONSTRAINT purchase_items_values_valid
  CHECK (quantity > 0 AND unit_price >= 0 AND total >= 0) NOT VALID;

ALTER TABLE public.quotation_items DROP CONSTRAINT IF EXISTS quotation_items_values_valid;
ALTER TABLE public.quotation_items ADD CONSTRAINT quotation_items_values_valid
  CHECK (quantity > 0 AND unit_price >= 0 AND discount >= 0 AND total >= 0) NOT VALID;

ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_amounts_nonneg;
ALTER TABLE public.sales ADD CONSTRAINT sales_amounts_nonneg
  CHECK (subtotal >= 0 AND discount >= 0 AND tax >= 0 AND total >= 0) NOT VALID;

ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_amount_nonneg;
ALTER TABLE public.purchases ADD CONSTRAINT purchases_amount_nonneg
  CHECK (total_amount >= 0) NOT VALID;

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_amount_nonneg;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_amount_nonneg
  CHECK (amount >= 0) NOT VALID;

-- ============================================================================
-- 3. Audit log (append-only for clients)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  actor_id    uuid,
  action      text NOT NULL,          -- INSERT | UPDATE | DELETE | login | logout | client_error | ...
  table_name  text,
  record_id   text,
  shop_id     uuid,                   -- no FK on purpose: log survives shop deletion
  old_data    jsonb,
  new_data    jsonb,
  details     jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_shop    ON public.audit_log (shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor   ON public.audit_log (actor_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

-- Only super admins and the owner of the shop can read. Nobody can write directly.
DROP POLICY IF EXISTS "Read audit log" ON public.audit_log;
CREATE POLICY "Read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    private.is_super_admin()
    OR (shop_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.shops s WHERE s.id = audit_log.shop_id AND s.owner_id = auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row  jsonb;
  v_old  jsonb;
  v_shop uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_row := to_jsonb(OLD);
  ELSE
    v_row := to_jsonb(NEW);
  END IF;
  IF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
  END IF;

  IF TG_TABLE_NAME = 'shops' THEN
    v_shop := (v_row ->> 'id')::uuid;
  ELSE
    v_shop := (v_row ->> 'shop_id')::uuid;
  END IF;

  INSERT INTO public.audit_log (actor_id, action, table_name, record_id, shop_id, old_data, new_data)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME, v_row ->> 'id', v_shop,
    v_old,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE v_row END
  );
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['shops','products','sales','purchases','expenses','quotations','shop_users','user_roles','subscriptions']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%1$s ON public.%1$I', t);
    EXECUTE format('CREATE TRIGGER trg_audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t);
  END LOOP;
END $$;

-- Client-reported events: logins and front-end crashes (whitelisted, size-capped, rate-limited)
CREATE OR REPLACE FUNCTION public.log_audit_event(p_action text, p_details jsonb DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  IF p_action NOT IN ('login', 'logout', 'client_error', 'password_reset_requested') THEN
    RAISE EXCEPTION 'Unknown audit action';
  END IF;
  IF p_action = 'client_error' AND (
       SELECT count(*) FROM public.audit_log
        WHERE actor_id = auth.uid() AND action = 'client_error'
          AND created_at > now() - interval '1 minute') >= 10 THEN
    RETURN;
  END IF;
  INSERT INTO public.audit_log (actor_id, action, table_name, details)
  VALUES (auth.uid(), p_action, 'client',
          jsonb_build_object('info', left(COALESCE(p_details::text, ''), 1500)));
END;
$$;
REVOKE ALL ON FUNCTION public.log_audit_event(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, jsonb) TO authenticated;

-- ============================================================================
-- 4. Separation of duties: the last super admin cannot be removed
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_removal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role::text = 'super_admin' AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
        WHERE role::text = 'super_admin' AND user_id <> OLD.user_id) THEN
    RAISE EXCEPTION 'You cannot remove the last super admin';
  END IF;
  RETURN OLD;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.prevent_last_super_admin_removal() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_keep_last_super_admin ON public.user_roles;
CREATE TRIGGER trg_keep_last_super_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_super_admin_removal();

-- ============================================================================
-- 5. Atomic creation (one transaction each; all-or-nothing). SECURITY INVOKER,
--    so row-level security still applies to the caller.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_sale(
  p_shop_id        uuid,
  p_items          jsonb,
  p_payment_method text    DEFAULT 'cash',
  p_payment_status text    DEFAULT 'paid',
  p_customer_name  text    DEFAULT NULL,
  p_customer_phone text    DEFAULT NULL,
  p_notes          text    DEFAULT NULL,
  p_discount       numeric DEFAULT 0,
  p_tax            numeric DEFAULT 0
) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_item     jsonb;
  v_product  public.products%ROWTYPE;
  v_qty      integer;
  v_price    numeric;
  v_disc     numeric;
  v_line     numeric;
  v_subtotal numeric := 0;
  v_sale_id  uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Add at least one item';
  END IF;
  IF COALESCE(p_discount, 0) < 0 OR COALESCE(p_tax, 0) < 0 THEN
    RAISE EXCEPTION 'Discount and tax cannot be negative';
  END IF;

  -- Pass 1: validate and total (no writes yet)
  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    v_qty := (v_item ->> 'quantity')::integer;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;
    SELECT * INTO v_product FROM public.products
     WHERE id = (v_item ->> 'product_id')::uuid AND shop_id = p_shop_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product was not found in this shop';
    END IF;
    v_price := COALESCE((v_item ->> 'unit_price')::numeric, v_product.selling_price);
    v_disc  := COALESCE((v_item ->> 'discount')::numeric, 0);
    IF v_price < 0 OR v_disc < 0 THEN
      RAISE EXCEPTION 'Price and discount cannot be negative';
    END IF;
    v_line := v_qty * v_price - v_disc;
    IF v_line < 0 THEN
      RAISE EXCEPTION 'Discount cannot be more than the item total';
    END IF;
    v_subtotal := v_subtotal + v_line;
  END LOOP;

  INSERT INTO public.sales (shop_id, user_id, receipt_number, subtotal, discount, tax, total,
                            payment_method, payment_status, customer_name, customer_phone, notes)
  VALUES (p_shop_id, auth.uid(),
          'REC-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
          v_subtotal, COALESCE(p_discount, 0), COALESCE(p_tax, 0),
          GREATEST(v_subtotal - COALESCE(p_discount, 0) + COALESCE(p_tax, 0), 0),
          p_payment_method, p_payment_status, p_customer_name, p_customer_phone, p_notes)
  RETURNING id INTO v_sale_id;

  -- Pass 2: items (the stock trigger enforces availability; any failure rolls everything back)
  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item ->> 'product_id')::uuid;
    v_qty   := (v_item ->> 'quantity')::integer;
    v_price := COALESCE((v_item ->> 'unit_price')::numeric, v_product.selling_price);
    v_disc  := COALESCE((v_item ->> 'discount')::numeric, 0);
    INSERT INTO public.sale_items (sale_id, product_id, product_name, quantity, unit_price, discount, total)
    VALUES (v_sale_id, v_product.id, v_product.name, v_qty, v_price, v_disc, v_qty * v_price - v_disc);
  END LOOP;

  RETURN v_sale_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_purchase(
  p_shop_id        uuid,
  p_items          jsonb,
  p_supplier_name  text DEFAULT NULL,
  p_supplier_phone text DEFAULT NULL,
  p_payment_method text DEFAULT 'cash',
  p_payment_status text DEFAULT 'paid',
  p_notes          text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_item        jsonb;
  v_product     public.products%ROWTYPE;
  v_qty         integer;
  v_price       numeric;
  v_total       numeric := 0;
  v_purchase_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Add at least one item';
  END IF;

  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    v_qty   := (v_item ->> 'quantity')::integer;
    v_price := (v_item ->> 'unit_price')::numeric;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;
    IF v_price IS NULL OR v_price < 0 THEN
      RAISE EXCEPTION 'Unit price cannot be negative';
    END IF;
    PERFORM 1 FROM public.products
     WHERE id = (v_item ->> 'product_id')::uuid AND shop_id = p_shop_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product was not found in this shop';
    END IF;
    v_total := v_total + v_qty * v_price;
  END LOOP;

  INSERT INTO public.purchases (shop_id, user_id, supplier_name, supplier_phone, total_amount,
                                payment_method, payment_status, notes, purchase_date)
  VALUES (p_shop_id, auth.uid(), p_supplier_name, p_supplier_phone, v_total,
          p_payment_method, p_payment_status, p_notes, CURRENT_DATE)
  RETURNING id INTO v_purchase_id;

  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item ->> 'product_id')::uuid;
    v_qty   := (v_item ->> 'quantity')::integer;
    v_price := (v_item ->> 'unit_price')::numeric;
    INSERT INTO public.purchase_items (purchase_id, product_id, product_name, quantity, unit_price, total)
    VALUES (v_purchase_id, v_product.id, v_product.name, v_qty, v_price, v_qty * v_price);
  END LOOP;

  RETURN v_purchase_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_quotation(
  p_shop_id          uuid,
  p_items            jsonb,
  p_quotation_number text,
  p_customer_name    text,
  p_customer_phone   text    DEFAULT NULL,
  p_customer_email   text    DEFAULT NULL,
  p_valid_until      date    DEFAULT NULL,
  p_notes            text    DEFAULT NULL,
  p_subtotal         numeric DEFAULT 0,
  p_discount         numeric DEFAULT 0,
  p_tax              numeric DEFAULT 0,
  p_total            numeric DEFAULT 0
) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_item         jsonb;
  v_quotation_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_customer_name IS NULL OR btrim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Add at least one item';
  END IF;
  IF p_subtotal < 0 OR p_discount < 0 OR p_tax < 0 OR p_total < 0 THEN
    RAISE EXCEPTION 'Amounts cannot be negative';
  END IF;

  INSERT INTO public.quotations (shop_id, user_id, quotation_number, customer_name, customer_phone,
                                 customer_email, valid_until, notes, subtotal, discount, tax, total, status)
  VALUES (p_shop_id, auth.uid(), p_quotation_number, btrim(p_customer_name), p_customer_phone,
          p_customer_email, p_valid_until, p_notes, p_subtotal, p_discount, p_tax, p_total, 'pending')
  RETURNING id INTO v_quotation_id;

  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    INSERT INTO public.quotation_items (quotation_id, product_id, product_name, quantity, unit_price, discount, total)
    VALUES (v_quotation_id,
            NULLIF(v_item ->> 'product_id', '')::uuid,
            v_item ->> 'product_name',
            (v_item ->> 'quantity')::integer,
            (v_item ->> 'unit_price')::numeric,
            COALESCE((v_item ->> 'discount')::numeric, 0),
            (v_item ->> 'total')::numeric);
  END LOOP;

  RETURN v_quotation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_sale(uuid, jsonb, text, text, text, text, text, numeric, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_purchase(uuid, jsonb, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_quotation(uuid, jsonb, text, text, text, text, date, text, numeric, numeric, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sale(uuid, jsonb, text, text, text, text, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase(uuid, jsonb, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_quotation(uuid, jsonb, text, text, text, text, date, text, numeric, numeric, numeric, numeric) TO authenticated;

-- ============================================================================
-- 6. Indexes for growth (all IF NOT EXISTS)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_shop           ON public.products (shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_shop_created      ON public.sales (shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale         ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product      ON public.sale_items (product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_shop_date     ON public.purchases (shop_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shop_date      ON public.expenses (shop_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_shop_created ON public.quotations (shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quote   ON public.quotation_items (quotation_id);
CREATE INDEX IF NOT EXISTS idx_shop_users_user         ON public.shop_users (user_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_shop_users_shop         ON public.shop_users (shop_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user    ON public.support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shops_owner             ON public.shops (owner_id);
