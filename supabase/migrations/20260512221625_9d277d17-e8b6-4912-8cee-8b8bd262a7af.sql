
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS registration_fee numeric NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS registration_fee_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_fee_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_fee_receipt text;

-- Backfill: existing rows already get 5000 via default; ensure not null is fine.

-- Extend trigger to log fee payment
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

  IF NEW.registration_fee_paid IS DISTINCT FROM OLD.registration_fee_paid AND NEW.registration_fee_paid THEN
    INSERT INTO public.subscription_events
      (subscription_id, user_id, event_type, amount, receipt_reference, actor_id, notes)
    VALUES (NEW.id, NEW.user_id, 'registration_fee_paid', NEW.registration_fee,
            NEW.registration_fee_receipt, auth.uid(), 'One-time registration fee');
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
