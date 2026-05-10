
-- 1. Role enum + table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
$$;

-- 3. user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage roles insert" ON public.user_roles;
CREATE POLICY "Super admins manage roles insert" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage roles update" ON public.user_roles;
CREATE POLICY "Super admins manage roles update" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage roles delete" ON public.user_roles;
CREATE POLICY "Super admins manage roles delete" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_super_admin());

-- 4. Super-admin override policies on existing tables
-- shops
CREATE POLICY "Super admins full access shops select" ON public.shops FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access shops update" ON public.shops FOR UPDATE TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access shops delete" ON public.shops FOR DELETE TO authenticated USING (public.is_super_admin());

-- profiles
CREATE POLICY "Super admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- subscriptions
CREATE POLICY "Super admins view all subs" ON public.subscriptions FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins update all subs" ON public.subscriptions FOR UPDATE TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins insert subs" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());

-- sales
CREATE POLICY "Super admins view all sales" ON public.sales FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins delete sales" ON public.sales FOR DELETE TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins view all sale_items" ON public.sale_items FOR SELECT TO authenticated USING (public.is_super_admin());

-- expenses
CREATE POLICY "Super admins view all expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins delete expenses" ON public.expenses FOR DELETE TO authenticated USING (public.is_super_admin());

-- purchases
CREATE POLICY "Super admins view all purchases" ON public.purchases FOR SELECT TO authenticated USING (public.is_super_admin());

-- products
CREATE POLICY "Super admins view all products" ON public.products FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins delete products" ON public.products FOR DELETE TO authenticated USING (public.is_super_admin());

-- quotations
CREATE POLICY "Super admins view all quotations" ON public.quotations FOR SELECT TO authenticated USING (public.is_super_admin());

-- 5. Allow profile role-change trigger bypass for super admins
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;
  RETURN NEW;
END;
$$;
