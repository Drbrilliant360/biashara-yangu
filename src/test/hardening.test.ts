import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

// These are static checks on the SQL / edge-function source. They cannot prove the database behaves
// correctly (run the migration on a staging project for that) but they stop the key rules being removed by accident.
describe('database migration rules (20261117090000_audit_atomic_hardening.sql)', () => {
  const sql = read('supabase/migrations/20261117090000_audit_atomic_hardening.sql');

  it('removes the duplicate stock triggers and keeps exactly one per table', () => {
    for (const t of ['on_sale_item_created', 'update_stock_after_sale_trigger', 'on_purchase_item_created', 'update_stock_after_purchase_trigger']) {
      expect(sql).toContain(`DROP TRIGGER IF EXISTS ${t}`);
    }
    expect(sql.match(/CREATE TRIGGER trg_stock_after_sale/g)).toHaveLength(1);
    expect(sql.match(/CREATE TRIGGER trg_stock_after_purchase/g)).toHaveLength(1);
  });

  it('stock triggers are tenant-safe and block negative stock', () => {
    expect(sql).toMatch(/AND shop_id = v_shop\s+AND stock_quantity >= NEW\.quantity/);
    expect(sql).toContain('Not enough stock');
  });

  it('audit log is append-only for clients and readable only by super admins / shop owners', () => {
    expect(sql).toContain('ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('GRANT SELECT ON public.audit_log TO authenticated');
    expect(sql).not.toMatch(/GRANT (INSERT|UPDATE|DELETE|ALL)[^;]*ON public\.audit_log TO authenticated/);
    expect(sql).not.toMatch(/CREATE POLICY[^;]*ON public\.audit_log\s+FOR (INSERT|UPDATE|DELETE)/);
    expect(sql).toContain('private.is_super_admin()');
  });

  it('audits every business table', () => {
    for (const t of ['shops', 'products', 'sales', 'purchases', 'expenses', 'quotations', 'shop_users', 'user_roles', 'subscriptions']) {
      expect(sql).toContain(`'${t}'`);
    }
  });

  it('atomic creation functions exist, run as the caller (RLS applies) and are not callable by anon', () => {
    for (const fn of ['create_sale', 'create_purchase', 'create_quotation']) {
      expect(sql).toContain(`FUNCTION public.${fn}(`);
      expect(sql).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\([^)]*\\) FROM PUBLIC, anon`));
      expect(sql).toMatch(new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${fn}\\([^)]*\\) TO authenticated`));
    }
    const rpcBlock = sql.slice(sql.indexOf('create_sale('), sql.indexOf('-- 6. Indexes'));
    expect(rpcBlock).not.toContain('SECURITY DEFINER');
  });

  it('rejects negative values and protects the last super admin', () => {
    expect(sql).toContain('products_prices_nonneg');
    expect(sql).toContain('sale_items_values_valid');
    expect(sql).toContain('You cannot remove the last super admin');
  });

  it('only whitelisted client audit events are accepted', () => {
    expect(sql).toContain("p_action NOT IN ('login', 'logout', 'client_error', 'password_reset_requested')");
  });
});

describe('edge function rules', () => {
  it('price is set on the server, never taken from the browser', () => {
    const create = read('supabase/functions/snippe-create-payment/index.ts');
    expect(create).toContain('SUBSCRIPTION_AMOUNT_TZS');
    expect(create).not.toMatch(/amount:\s*Number\(amount\)/);
    expect(create).toMatch(/\^255\[67\]\[0-9\]\{8\}\$/); // phone validated
  });

  it('payment check validates the reference and applies renewal only once', () => {
    const check = read('supabase/functions/snippe-check-payment/index.ts');
    const shared = read('supabase/functions/_shared/payments.ts');
    expect(check).toContain('REFERENCE_RE');
    expect(shared).toMatch(/\[A-Za-z0-9_-\]\{6,80\}/);
    expect(shared).toContain('encodeURIComponent(reference)');
    // renewal happens in ONE atomic database call that can only succeed once per reference
    expect(shared).toContain('apply_subscription_payment');
    const sql = read('supabase/migrations/20261118090000_payments_ratelimit_state_machines.sql');
    expect(sql).toMatch(/applied_at IS NULL/);
    expect(sql).toMatch(/reference\s+text NOT NULL UNIQUE/);
  });

  it('webhook never trusts the request body and is not callable with a user JWT only', () => {
    const hook = read('supabase/functions/snippe-webhook/index.ts');
    expect(hook).toContain('reconcilePayment'); // provider is asked directly
    expect(hook).toContain('safeEqual');         // constant-time secret check
    expect(hook).toMatch(/status:\s*500|, 500,/); // transient failures return 5xx so the provider retries
    expect(read('supabase/config.toml')).toMatch(/\[functions\.snippe-webhook\]\s+verify_jwt = false/);
    // only payments we created are honoured
    expect(read('supabase/functions/_shared/payments.ts')).toContain('unknown_reference');
  });

  it('paid-user flows are rate limited and have timeouts', () => {
    for (const fn of ['snippe-create-payment', 'snippe-check-payment', 'mauzo-ai', 'delete-account']) {
      expect(read(`supabase/functions/${fn}/index.ts`)).toContain('allow(');
    }
    const http = read('supabase/functions/_shared/http.ts');
    expect(http).toContain('AbortController');
    expect(http).toContain('Idempotency-Key'); // POST retried only with an idempotency key
    for (const fn of ['snippe-create-payment', 'mauzo-ai']) {
      expect(read(`supabase/functions/${fn}/index.ts`)).toContain('fetchWithRetry');
      expect(read(`supabase/functions/${fn}/index.ts`)).not.toMatch(/await fetch\(/);
    }
  });

  it('no function allows any origin, and errors do not leak internals', () => {
    for (const fn of ['mauzo-ai', 'snippe-create-payment', 'snippe-check-payment', 'delete-account']) {
      const src = read(`supabase/functions/${fn}/index.ts`);
      expect(src).toContain('corsFor(req)');
      expect(src).not.toContain('"Access-Control-Allow-Origin": "*"');
      expect(src).not.toMatch(/error:\s*(String\(e\)|e\.message|\(e as Error\)\.message)/); // never echo internals to the client
      expect(src).not.toMatch(/console\.log\(.*(phone|email|snippeData)/i); // no personal data in logs
    }
    expect(read('supabase/functions/_shared/cors.ts')).not.toContain('"*"');
  });

  it('account deletion writes an audit record before deleting', () => {
    const del = read('supabase/functions/delete-account/index.ts');
    expect(del.indexOf('audit_log')).toBeGreaterThan(-1);
    expect(del.indexOf('audit_log')).toBeLessThan(del.indexOf('auth.admin.deleteUser'));
  });
});

describe('deployment config', () => {
  it('sets security headers and is valid JSON', () => {
    const cfg = JSON.parse(read('vercel.json'));
    const keys = cfg.headers[0].headers.map((h: { key: string }) => h.key);
    for (const k of ['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']) {
      expect(keys).toContain(k);
    }
    expect(keys.some((k: string) => k.startsWith('Content-Security-Policy'))).toBe(true);
  });

  it('has CI, Dependabot and backup tooling', () => {
    for (const f of ['.github/workflows/ci.yml', '.github/dependabot.yml', 'scripts/backup-db.sh', 'scripts/verify-restore.sh', 'docs/BACKUP_AND_RECOVERY.md']) {
      expect(fs.existsSync(path.join(root, f))).toBe(true);
    }
  });

  it('Android targets SDK 35 (Google Play requirement)', () => {
    expect(read('mobile-android/android/variables.gradle')).toMatch(/targetSdkVersion = 35/);
  });

  it('no secrets are committed in source files', () => {
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    const hits = walk(path.join(root, 'src')).filter((f) => /\.(ts|tsx)$/.test(f) && /(API_TOKEN|SECRET|PRIVATE_KEY)\s*[:=]\s*['"][A-Za-z0-9_-]{20,}/.test(fs.readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
});

describe('client helpers', () => {
  it('logAuditEvent never throws, even if the backend call fails', async () => {
    vi.resetModules();
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: { rpc: () => { throw new Error('network down'); } },
    }));
    const { logAuditEvent } = await import('@/lib/rpc');
    expect(() => logAuditEvent('login')).not.toThrow();
  });

  it('reportClientError truncates long messages before sending', async () => {
    vi.resetModules();
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    vi.doMock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
    const { reportClientError } = await import('@/lib/reportError');
    reportClientError(new Error('x'.repeat(5000)), 'test');
    expect(rpc).toHaveBeenCalledTimes(1);
    const args = rpc.mock.calls[0] as unknown as [string, { p_action: string; p_details: { message: string } }];
    expect(args[0]).toBe('log_audit_event');
    expect(args[1].p_action).toBe('client_error');
    expect(args[1].p_details.message.length).toBeLessThanOrEqual(300);
  });
});
