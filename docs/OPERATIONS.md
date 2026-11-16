# Operations runbook

## Secrets (Supabase → Edge Functions → Secrets; never in git or the browser)
| Secret | Used by | Notes |
|---|---|---|
| `SNIPPE_API_KEY` | create/check payment, webhook, reconcile | Rotate if exposed. |
| `SNIPPE_WEBHOOK_SECRET` | snippe-webhook | Random 32+ chars. Put it in the webhook URL you give Snippe: `.../functions/v1/snippe-webhook?token=<secret>` |
| `CRON_SECRET` | reconcile-payments | Random 32+ chars; the scheduler sends it as a Bearer token. |
| `LOVABLE_API_KEY` | mauzo-ai | |
| `ALERT_WEBHOOK_URL` | all (alerts) | Slack-compatible incoming webhook. Optional but strongly recommended. |
| `ALLOWED_ORIGINS` | CORS | Extra origins, comma separated. |

Only `VITE_SUPABASE_URL` and the publishable (anon) key are in the web bundle; they are public by design and protected by row-level security. Never put the service-role key in `VITE_*` variables.

## Payment flow (state machine)
`pending → completed (applied once) | failed | voided | expired`
1. `snippe-create-payment` calls the provider (with an idempotency key) and writes a `payments` row.
2. The app polls `snippe-check-payment`; **and** the provider calls `snippe-webhook`; **and** `reconcile-payments` sweeps unfinished payments. All three call the same `reconcilePayment()`, which asks the provider for the real status and then runs `apply_subscription_payment()`, an atomic database function that can extend the subscription **only once per reference**.
3. Customer paid but still not upgraded? Look for the alert "Customer paid but subscription was NOT extended", then run `select * from payments where reference = '...'` and call `reconcile-payments` manually.

### One-time setup
```bash
supabase secrets set SNIPPE_WEBHOOK_SECRET=... CRON_SECRET=... ALERT_WEBHOOK_URL=...
supabase functions deploy snippe-create-payment snippe-check-payment snippe-webhook reconcile-payments mauzo-ai delete-account
```
Schedule the sweep every 5 minutes (Supabase SQL editor; needs the `pg_cron` and `pg_net` extensions enabled):
```sql
select cron.schedule('reconcile-payments', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://ofgjvperpkjazpidjmmf.supabase.co/functions/v1/reconcile-payments',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb);
$$);
```
In the Snippe dashboard, register the webhook URL above (ask Snippe support which header or signature they send; the function works with the secret in the URL and never trusts the body).

## Rate limits (table `rate_limits`, function `check_rate_limit`)
| Action | Limit |
|---|---|
| Start a payment | 5 per 10 min per user |
| Check payment status | 120 per 10 min per user |
| Mauzo AI question | 30 per hour, 200 per day per user (each is a paid AI call; reply capped at 1200 tokens) |
| Delete account | 3 per hour per user |
| Webhook per reference | 30 per 10 min |

Login/sign-up brute force is limited by Supabase Auth (Dashboard → Authentication → Rate Limits; review them and enable CAPTCHA if abused).

## Timeouts and retries
* Browser → backend: 30 s to receive a response (streaming answers are not cut off); queries retry up to 2 times with exponential backoff and jitter, never on 4xx; **mutations are never retried automatically**.
* Edge function → provider: 8–15 s timeout; retries (exponential backoff + jitter, honours `Retry-After`) only for GET or POST with an Idempotency-Key. The AI call is not retried (a retry would bill twice).

## Logging and alerts
Edge functions write one JSON line per event: `{level, fn, event, rid, ts, ...}`; no phone numbers, emails or tokens. In Supabase → Logs → Edge Functions filter `level":"error`. Create an alert (log drain or the Supabase alerts feature) on any `error` from `snippe-*` and on `reconcile_item_failed` bursts. Browser errors land in `audit_log` (action `client_error`, visible at Admin → Audit). Payment emergencies also post to `ALERT_WEBHOOK_URL`.

## Database connections
The web app and edge functions use the Supabase REST API (PostgREST), which pools connections for you; they never open raw Postgres connections. For anything that connects directly (backup script, psql, future workers) use the **pooler** connection string (Dashboard → Database → Connection pooling, port 6543, transaction mode) and keep pool sizes small. Edge functions reuse one client per warm instance (cold starts only pay the import cost once; imports are pinned versions).

## Migrations
Forward-only, one change per file, written to be re-runnable (`IF NOT EXISTS`, `DROP ... IF EXISTS`). Order: staging first → take a backup (`scripts/backup-db.sh`) → production → deploy functions. CI applies all migrations to a fresh database. New CHECK constraints are added `NOT VALID` so existing rows cannot block a deploy; run `ALTER TABLE ... VALIDATE CONSTRAINT ...` after cleaning data.
