# Security notes

## What protects the system
- **Authentication:** Supabase Auth (email + password). Passwords need 8+ characters with a letter and a number. Sessions auto-refresh; password reset by email.
- **Authorization:** Postgres row-level security on every table. Writes limited by role (owner / manager / cashier); admin pages need `super_admin`, enforced in the database, not only in the UI. The last super admin cannot be removed.
- **Server-side rules:** prices are decided on the server; payments are verified with the provider before a subscription is extended; stock changes only inside the same shop and never below zero; sales, purchases and quotations are saved atomically (`create_sale`, `create_purchase`, `create_quotation`).
- **Input validation:** forms validate on the client (zod) and again in the database (CHECK constraints, RPC checks) and edge functions.
- **Fail secure:** missing/invalid sign-in → 401/403; admin pages deny access when the role lookup fails.
- **Audit log:** `audit_log` records inserts/updates/deletes on shops, products, sales, purchases, expenses, quotations, staff, roles and subscriptions, plus logins and front-end crashes. Clients can read (super admins, shop owners) but never write or delete it. Super admins see it at **Admin → Audit log**.
- **Transport:** HTTPS only. Security headers (HSTS, CSP, frame, referrer, permissions) in `vercel.json`. Edge functions only accept the app's own origins (extend with the `ALLOWED_ORIGINS` secret).
- **Updates:** Dependabot weekly; CI fails on high/critical advisories in shipped code.

## Known, accepted limits
- Sign-in token is kept in the WebView's app-private storage (not the OS keychain). Acceptable for this app's data; move to a secure-storage plugin if you start handling more sensitive data.
- No multi-factor authentication yet (Supabase supports TOTP; needs a UI and enabling it in the dashboard).
- Super admins can still change subscriptions and delete shops; every such change is audit-logged, but there is no second-person approval.
- Encryption at rest is provided by Supabase; verify in your project's settings.
- Turn on **leaked-password protection** and **email confirmation** in Supabase → Authentication.

## Reporting a vulnerability
Email the support address shown on the Terms page. Please do not open a public issue.

## Action required: rotate the old PalmPesa token
An old, unused file (`src/lib/palmPesaService.ts`, now deleted) contained a PalmPesa API token. It remains visible in Git history
(commits `00ac89d`, `adf5c28`). Deleting the file does not remove it from history, so **treat the token as leaked and revoke/rotate it
with PalmPesa** (and rotate any other key that was ever committed). Rewriting history is optional and disruptive; rotation is what matters.

## Content-Security-Policy status
`vercel.json` sends the CSP as **Content-Security-Policy-Report-Only** (it logs violations in the browser console but blocks nothing).
Before enforcing: open the deployed site, visit login, dashboard, reports, invoice generator (download a PDF) and Mauzo AI with DevTools open,
and confirm there are no "Content Security Policy" violations. Then rename the header key to `Content-Security-Policy`.
All other security headers (HSTS, nosniff, frame, referrer, permissions) are enforced.
