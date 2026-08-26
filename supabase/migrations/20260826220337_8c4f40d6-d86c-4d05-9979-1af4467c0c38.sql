CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL,
  name text,
  email text,
  phone text,
  category text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_response text,
  responded_at timestamp with time zone,
  responded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets" ON public.support_tickets
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" ON public.support_tickets
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all tickets" ON public.support_tickets
FOR SELECT TO authenticated USING (private.is_super_admin());

CREATE POLICY "Super admins can update tickets" ON public.support_tickets
FOR UPDATE TO authenticated USING (private.is_super_admin()) WITH CHECK (private.is_super_admin());

CREATE POLICY "Super admins can delete tickets" ON public.support_tickets
FOR DELETE TO authenticated USING (private.is_super_admin());

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();