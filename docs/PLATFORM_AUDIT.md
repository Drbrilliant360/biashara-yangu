# Platform audit: state machines, secrets, abuse, data, reliability

Legend: FIXED = changed in this repo · ACTION = needs you (deploy/config) · ACCEPTED = known limit

| # | Area | Finding | Status |
|---|---|---|---|
| 1 | **Payment state machine** | Renewal depended on the customer's phone staying open and polling. Closing the app after paying = paid but never upgraded. Idempotency used a read-then-write "compare and set"; first-time insert path had a race. | FIXED: `payments` ledger, provider webhook, 5-minute reconcile job, one atomic `apply_subscription_payment()`; only references we created are honoured |
| 2 | Subscription state | Any signed-in user could INSERT their own subscription row with `status='active'` and any end date (insert policy had no constraints; only rows missing the signup trigger were exposed). `trial` could be re-entered from `active`. | FIXED: insert policy limited to a fresh trial, status CHECK, transition trigger |
| 3 | Other state machines | Quotations/tickets could move between any states. | FIXED: accepted/rejected quotations and closed tickets are final; status CHECKs. Sales/purchases have no status transitions (payment_status only) |
| 4 | Front-end state | PaymentDialog could fire overlapping polls on slow networks. Idle/pending/success/error was already explicit. | FIXED: in-flight guard |
| 5 | **Secrets** | `.env` is tracked: contains only the public project URL/anon key (by design). Service-role key is only read inside edge functions. PalmPesa token still in git history. Whole provider responses (phone, email) were logged. | FIXED: logs carry no personal data; `requireEnv`. ACTION: rotate PalmPesa token; set the new secrets (docs/OPERATIONS.md) |
| 6 | **Rate limiting / cost** | None on payments (each = a prompt on a customer's phone), AI (paid per call) or account deletion. | FIXED: DB-backed limiter (works across instances), AI reply cap. ACTION: review Supabase Auth rate limits |
| 7 | **SQL injection** | No string-built SQL. All DB functions use fixed `search_path`. One real vector: the products search put user text into a PostgREST `.or()` filter (a comma/parenthesis added extra conditions). | FIXED: `escapeFilterTerm` + tests |
| 8 | **XSS** | Exports/print escape HTML; only `dangerouslySetInnerHTML` is shadcn chart CSS from developer config (not user input); AI replies rendered as markdown. | OK. ACTION: enforce the CSP (currently Report-Only) |
| 9 | **CORS** | Allow-list, no wildcard (done earlier). Webhook/cron functions send no CORS headers (server-to-server). | OK |
| 10 | **Migrations** | Untested against a real DB; hand-edited by tool. | FIXED: CI job applies all migrations to a fresh Supabase stack (marked non-blocking until first green run). ACTION: apply to staging first |
| 11 | **Backups** | Scripts + runbook exist; plan/PITR and restore drills are yours. | ACTION |
| 12 | **Webhooks** | There was none. | FIXED: secret check (constant time), body never trusted, 200 for ignorable, 5xx for retryable, throttled |
| 13 | **Timeouts / retries / backoff** | Outbound `fetch` had no timeout; no retries; browser requests could hang forever; default retry hit 4xx. | FIXED: `fetchWithRetry` (timeout, exponential backoff + jitter, only safe/idempotent calls), 30 s browser timeout, smarter query retry, mutations never auto-retried |
| 14 | **Cold starts / serverless limits** | Client created per request; imports pinned. Functions are small, do bounded work (reconcile batch of 25). | FIXED: module-scope client. ACCEPTED: cold start is one esm.sh import; vendor it if it ever matters |
| 15 | **Indexes** | Added earlier; missing composite for POS barcode lookup, role lookup, pending-payments scan. | FIXED |
| 16 | **N+1 queries** | No per-row query loops found in `src`. Sales/Purchases pages fetch items in one second query and group in memory (2 queries, not N+1). Admin pages still load whole tables. | OK. ACCEPTED: admin tables should move to server-side pagination before thousands of shops |
| 17 | **Connection pooling** | REST/PostgREST only; no raw connections. | OK, documented pooler use for direct clients |
| 18 | **Logging & alerts** | Unstructured `console.log` of provider payloads. | FIXED: structured JSON, request ids, alert hook. ACTION: set `ALERT_WEBHOOK_URL` and a log alert |
| 19 | **Idempotency** | Payment create used a timestamp key (double tap = two charges). Renewal now atomic. Sales/purchase RPCs are atomic but have no client-supplied key. | FIXED for payments. ACCEPTED: a retried sale on a flaky network can be recorded twice; mutations are not auto-retried and the button locks while saving |
| 20 | **Queues / background jobs** | None. | FIXED for the one job that matters: `payments` rows are the queue, `reconcile-payments` the worker (every 5 min). Nothing else needs async work yet |

## Not verified here
No Postgres or Deno on this machine: the SQL migration and edge functions were syntax-checked and covered by source-level tests only. Apply to staging and run one real test payment before production.
