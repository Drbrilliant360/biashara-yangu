-- Platform audit follow-up: payment ledger (idempotent), rate limiting, state machines, indexes.
-- Safe to re-run (idempotent). Apply to staging first.

-- ============================================================================
-- 1. Payment ledger: one row per provider reference, applied exactly once
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        text NOT NULL UNIQUE,
  user_id          uuid NOT NULL,
  amount           numeric NOT NULL CHECK (amount >= 0),
  purpose          text NOT NULL DEFAULT 'subscription',
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'completed', 'failed', 'voided', 'expired')),
  provider_status  text,
  applied_at       timestamptz,            -- set once, when the subscription was extended
  attempts         integer NOT NULL DEFAULT 0,
  last_checked_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_payments_user_created ON public.payments (user_id, created_at DESC);
-- the reconcile job scans only unfinished payments
CREATE INDEX IF NOT EXISTS idx_payments_pending ON public.payments (created_at) WHERE status = 'pending' OR (status = 'completed' AND applied_at IS NULL);

-- Atomic "apply this payment once". Returns true only for the call that applied it.
-- Concurrent polls, webhook retries and the reconcile job can all call this safely.
CREATE OR REPLACE FUNCTION public.apply_subscription_payment(p_reference text, p_user_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rows integer;
  v_now timestamptz := now();
BEGIN
  -- Claim the payment. Only one transaction can flip applied_at from NULL.
  UPDATE public.payments
     SET status = 'completed', provider_status = 'completed', applied_at = v_now, updated_at = v_now
   WHERE reference = p_reference AND user_id = p_user_id AND applied_at IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.subscriptions (user_id, status, current_period_end, last_payment_date, last_payment_reference, amount)
  VALUES (p_user_id, 'active', v_now + interval '30 days', v_now, p_reference, p_amount)
  ON CONFLICT (user_id) DO UPDATE
     SET status = 'active',
         current_period_end = GREATEST(public.subscriptions.current_period_end, v_now) + interval '30 days',
         last_payment_date = v_now,
         last_payment_reference = p_reference,
         amount = p_amount;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_subscription_payment(text, uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_payment(text, uuid, numeric) TO service_role;

-- ============================================================================
-- 2. Rate limiting (fixed window, atomic, per key)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  hits         integer NOT NULL DEFAULT 0
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_start);

-- Returns true when the call is allowed. Counts the attempt atomically (one statement, row lock).
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hits integer;
BEGIN
  INSERT INTO public.rate_limits AS r (key, window_start, hits)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE
     SET window_start = CASE WHEN r.window_start < now() - make_interval(secs => p_window_seconds) THEN now() ELSE r.window_start END,
         hits         = CASE WHEN r.window_start < now() - make_interval(secs => p_window_seconds) THEN 1 ELSE r.hits + 1 END
  RETURNING hits INTO v_hits;

  -- opportunistic cleanup (cheap, indexed) so the table never grows without bound
  IF random() < 0.02 THEN
    DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  END IF;

  RETURN v_hits <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- ============================================================================
-- 3. State machines: constrain values and legal transitions
-- ============================================================================
-- 3a. subscriptions: trial -> active -> expired/cancelled -> active. Never back to trial.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_valid;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_valid
  CHECK (status IN ('trial', 'active', 'expired', 'cancelled')) NOT VALID;

CREATE OR REPLACE FUNCTION public.enforce_subscription_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'trial' AND OLD.status <> 'trial' THEN
      RAISE EXCEPTION 'A subscription cannot go back to trial (% -> %)', OLD.status, NEW.status USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_subscription_transition ON public.subscriptions;
CREATE TRIGGER trg_subscription_transition BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_transition();

-- A user may only create their own *trial* row (the signup trigger normally does this).
-- Before: they could insert status='active' with any end date for themselves.
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users insert own trial subscription" ON public.subscriptions;
CREATE POLICY "Users insert own trial subscription" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'trial'
    AND current_period_end <= now() + interval '31 days'
    AND COALESCE(last_payment_reference, '') = ''
  );

-- 3b. support tickets: open -> in_progress -> resolved -> closed (reopen allowed from resolved only)
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_valid;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_status_valid
  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) NOT VALID;

CREATE OR REPLACE FUNCTION public.enforce_ticket_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND OLD.status = 'closed' THEN
    RAISE EXCEPTION 'A closed ticket cannot be reopened' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_ticket_transition ON public.support_tickets;
CREATE TRIGGER trg_ticket_transition BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ticket_transition();

-- 3c. quotations: pending -> accepted | rejected | expired. Accepted/rejected are final.
CREATE OR REPLACE FUNCTION public.enforce_quotation_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND OLD.status IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'A % quotation cannot change status', OLD.status USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_quotation_transition ON public.quotations;
CREATE TRIGGER trg_quotation_transition BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quotation_transition();

-- ============================================================================
-- 4. Extra indexes for the hot paths (POS barcode scan, user role lookups)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_shop_barcode ON public.products (shop_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_shop_active_name ON public.products (shop_id, name) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_created ON public.subscription_events (created_at DESC);
