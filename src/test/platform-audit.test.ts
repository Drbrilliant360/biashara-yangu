import { describe, it, expect, vi, afterEach } from 'vitest';
import { escapeFilterTerm } from '@/lib/postgrest';
import { installNetworkActivity, REQUEST_TIMEOUT_MS } from '@/lib/networkActivity';

describe('escapeFilterTerm (PostgREST filter injection)', () => {
  it('removes characters that could add filter conditions', () => {
    const evil = 'x,is_active.eq.false),name.ilike.%';
    const out = escapeFilterTerm(evil);
    expect(out).not.toMatch(/[,()%]/);
    expect(out).toContain('x');
  });
  it('keeps normal searches and limits length', () => {
    expect(escapeFilterTerm('  Sukari  1kg ')).toBe('Sukari 1kg');
    expect(escapeFilterTerm('a'.repeat(500))).toHaveLength(80);
    expect(escapeFilterTerm('')).toBe('');
  });
});

describe('backend request timeout', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

  it('aborts a hung backend request instead of spinning forever', async () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://hang.test');
    window.fetch = ((_: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))))) as typeof fetch;
    // installNetworkActivity only installs once per page load; reset the module for this test
    vi.resetModules();
    const mod = await import('@/lib/networkActivity');
    mod.installNetworkActivity();
    const p = window.fetch('https://hang.test/rest/v1/products').catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 10);
    const err = await p;
    expect((err as Error).message).toMatch(/timed out/i);
    void installNetworkActivity;
  });
});
