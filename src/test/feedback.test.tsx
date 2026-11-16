import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmProvider, useConfirm } from '@/components/feedback/ConfirmDialog';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { TableSkeletonRows, LoadingState } from '@/components/feedback/LoadingState';
import { Table, TableBody } from '@/components/ui/table';
import { friendlyError } from '@/lib/errors';
import {
  validate, loginSchema, registerSchema, shopSchema, paymentSchema, supportSchema,
} from '@/lib/validation';
import { FieldError } from '@/components/ui/field-error';
import { subscribeNetworkActivity, installNetworkActivity } from '@/lib/networkActivity';

describe('1 + 10: Button feedback and duplicate-action protection', () => {
  it('has press feedback classes', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).className).toMatch(/active:scale/);
  });

  it('locks itself and shows a spinner while an async click is running (no double submit)', async () => {
    let resolve!: () => void;
    const onClick = vi.fn(() => new Promise<void>((r) => { resolve = r; }));
    render(<Button onClick={onClick}>Pay</Button>);
    const btn = screen.getByRole('button', { name: 'Pay' });

    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('svg.animate-spin')).not.toBeNull();

    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);

    await act(async () => { resolve(); });
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it('loading prop disables the button and blocks clicks', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Submit</Button>);
    const btn = screen.getByRole('button', { name: 'Submit' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sync handlers still work normally', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('10: confirmation before critical actions', () => {
  const Harness: React.FC<{ onResult: (v: boolean) => void }> = ({ onResult }) => {
    const confirm = useConfirm();
    return <button onClick={async () => onResult(await confirm({ title: 'Delete item?', description: 'Cannot be undone.', destructive: true }))}>ask</button>;
  };

  it('resolves true when confirmed and false when cancelled', async () => {
    const onResult = vi.fn();
    render(<ConfirmProvider><Harness onResult={onResult} /></ConfirmProvider>);

    fireEvent.click(screen.getByText('ask'));
    expect(await screen.findByText('Delete item?')).toBeInTheDocument();
    expect(screen.getByText('Cannot be undone.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(false));

    fireEvent.click(screen.getByText('ask'));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(true));
  });
});

describe('2: loading states', () => {
  it('LoadingState announces itself; table skeleton renders placeholder rows', () => {
    const { container } = render(
      <>
        <LoadingState label="Loading sales..." />
        <Table><TableBody><TableSkeletonRows cols={3} rows={4} /></TableBody></Table>
      </>
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading sales...');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(container.querySelectorAll('tbody td')).toHaveLength(12);
  });
});

describe('3: global progress (network activity)', () => {
  it('counts in-flight backend requests and ignores unrelated ones', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://backend.test');
    const real = vi.fn(async () => new Response('ok'));
    window.fetch = real as unknown as typeof fetch;
    installNetworkActivity();

    const seen: number[] = [];
    const off = subscribeNetworkActivity((n) => seen.push(n));
    await window.fetch('https://backend.test/rest/v1/products');
    await window.fetch('https://other.example/thing');
    off();

    expect(Math.max(...seen)).toBe(1);   // backend call shown as activity
    expect(seen[seen.length - 1]).toBe(0); // and cleared afterwards
    expect(seen.filter((n) => n > 0)).toHaveLength(1); // unrelated request not counted
    vi.unstubAllEnvs();
  });
});

describe('5: friendly errors', () => {
  const origOnline = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');
  afterEach(() => { if (origOnline) Object.defineProperty(window.navigator, 'onLine', origOnline); });

  it.each([
    [{ message: 'Failed to fetch' }, /internet connection/i],
    [{ message: 'Invalid login credentials' }, /wrong email or password/i],
    [{ message: 'User already registered' }, /already exists/i],
    [{ message: 'JWT expired' }, /session has expired/i],
    [{ code: '23505', message: 'duplicate key value' }, /already exists/i],
    [{ code: '42501', message: 'new row violates row-level security policy' }, /permission/i],
    [{ status: 429, message: 'x' }, /too many attempts/i],
  ])('maps %j', (err, expected) => {
    expect(friendlyError(err)).toMatch(expected as RegExp);
  });

  it('uses the fallback for unknown errors and handles null', () => {
    expect(friendlyError({ message: 'weird' }, 'Custom fallback')).toBe('Custom fallback');
    expect(friendlyError(null)).toMatch(/something went wrong/i);
  });

  it('says you are offline when the device is offline', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    expect(friendlyError({ message: 'anything' })).toMatch(/offline/i);
  });

  it('OfflineBanner appears when the connection drops and disappears when it returns', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
    render(<OfflineBanner />);
    expect(screen.queryByRole('alert')).toBeNull();
    act(() => { window.dispatchEvent(new Event('offline')); });
    expect(screen.getByRole('alert')).toHaveTextContent(/offline/i);
    act(() => { window.dispatchEvent(new Event('online')); });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('ErrorBoundary shows a recoverable screen when a page crashes', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Boom = () => { throw new Error('boom'); };
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe('6: form validation', () => {
  beforeEach(() => {});

  it('login: reports missing and malformed fields with instructions', () => {
    let r = validate(loginSchema, { email: '', password: '' });
    expect(r.ok).toBe(false);
    expect(r.errors.email).toMatch(/enter your email/i);
    expect(r.errors.password).toMatch(/enter your password/i);

    r = validate(loginSchema, { email: 'not-an-email', password: 'x' });
    expect(r.errors.email).toMatch(/valid email/i);

    expect(validate(loginSchema, { email: 'a@b.co', password: 'secret1' }).ok).toBe(true);
  });

  it('register: name, email and password length', () => {
    const r = validate(registerSchema, { name: 'A', email: 'bad', password: '123' });
    expect(Object.keys(r.errors).sort()).toEqual(['email', 'name', 'password']);
    expect(validate(registerSchema, { name: 'Amina Juma', email: 'amina@example.com', password: '123456' }).ok).toBe(true);
  });

  it('shop: requires a name, optional email/phone must be valid when present', () => {
    expect(validate(shopSchema, { name: '', email: '', phone: '' }).errors.name).toBeTruthy();
    expect(validate(shopSchema, { name: 'Duka', email: 'x', phone: '' }).errors.email).toBeTruthy();
    expect(validate(shopSchema, { name: 'Duka', email: '', phone: '12' }).errors.phone).toBeTruthy();
    expect(validate(shopSchema, { name: 'Duka', email: '', phone: '' }).ok).toBe(true);
  });

  it('payment: requires a Tanzanian mobile-money number', () => {
    const base = { firstName: 'A', lastName: 'B', email: 'a@b.co' };
    expect(validate(paymentSchema, { ...base, phone: '12345' }).errors.phone).toMatch(/mobile money/i);
    expect(validate(paymentSchema, { ...base, phone: '0712345678' }).ok).toBe(true);
    expect(validate(paymentSchema, { ...base, phone: '+255712345678' }).ok).toBe(true);
  });

  it('support message: needs subject and enough detail', () => {
    const r = validate(supportSchema, { subject: 'Hi', message: 'short' });
    expect(r.errors.subject).toBeTruthy();
    expect(r.errors.message).toBeTruthy();
  });

  it('FieldError renders an accessible alert only when there is a message', () => {
    const { rerender } = render(<FieldError id="x-error" message="Enter your name." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your name.');
    rerender(<FieldError id="x-error" />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
