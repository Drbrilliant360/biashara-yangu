
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- payment | trial_extended | cancelled | activated | expired | created | updated
  previous_status text,
  new_status text,
  amount numeric,
  receipt_reference text,
  period_end timestamptz,
  notes text,
  actor_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_sub ON public.subscription_events(subscription_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_events_user ON public.subscription_events(user_id, created_at DESC);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own sub events" ON public.subscription_events;
CREATE POLICY "Users view own sub events" ON public.subscription_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins insert sub events" ON public.subscription_events;
CREATE POLICY "Super admins insert sub events" ON public.subscription_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR user_id = auth.uid());

-- Auto-log trigger on subscription changes
CREATE OR REPLACE FUNCTION public.log_subscription_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.subscription_events
      (subscription_id, user_id, event_type, new_status, amount, period_end, actor_id)
    VALUES (NEW.id, NEW.user_id, 'created', NEW.status, NEW.amount, NEW.current_period_end, auth.uid());
    RETURN NEW;
  END IF;

  IF NEW.last_payment_date IS DISTINCT FROM OLD.last_payment_date AND NEW.last_payment_date IS NOT NULL THEN
    v_type := 'payment';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    v_type := CASE NEW.status
      WHEN 'cancelled' THEN 'cancelled'
      WHEN 'active' THEN 'activated'
      WHEN 'expired' THEN 'expired'
      ELSE 'status_changed'
    END;
  ELSIF NEW.trial_end IS DISTINCT FROM OLD.trial_end THEN
    v_type := 'trial_extended';
  ELSE
    v_type := 'updated';
  END IF;

  INSERT INTO public.subscription_events
    (subscription_id, user_id, event_type, previous_status, new_status, amount, period_end, actor_id, metadata)
  VALUES (
    NEW.id, NEW.user_id, v_type, OLD.status, NEW.status,
    CASE WHEN v_type = 'payment' THEN NEW.amount ELSE NULL END,
    NEW.current_period_end, auth.uid(),
    jsonb_build_object(
      'trial_end_old', OLD.trial_end, 'trial_end_new', NEW.trial_end,
      'period_end_old', OLD.current_period_end, 'period_end_new', NEW.current_period_end
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_subscription_event ON public.subscriptions;
CREATE TRIGGER trg_log_subscription_event
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.log_subscription_event();
