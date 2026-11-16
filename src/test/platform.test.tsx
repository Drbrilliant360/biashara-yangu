import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

let mockPlatform: 'web' | 'ios' | 'android' = 'web';
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => mockPlatform,
    isNativePlatform: () => mockPlatform !== 'web',
  },
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: vi.fn() } } }));

import { canPayInApp, isIOSApp, isNative, getPlatform } from '@/lib/platform';
import { PaymentDialog } from '@/components/billing/PaymentDialog';
import { SubscriptionWidget } from '@/components/billing/SubscriptionWidget';
import { SubscriptionReminder } from '@/components/billing/SubscriptionReminder';
import type { SubscriptionInfo } from '@/hooks/useSubscription';

const expired: SubscriptionInfo = {
  status: 'expired', daysRemaining: 0, trialEnd: null, currentPeriodEnd: null,
  isExpired: true, isTrial: false, isWarning: false, registrationFee: 5000, registrationFeePaid: true,
};

describe('platform helpers', () => {
  beforeEach(() => { mockPlatform = 'web'; });

  it('web: payments allowed, not native', () => {
    expect(getPlatform()).toBe('web');
    expect(isNative()).toBe(false);
    expect(canPayInApp()).toBe(true);
  });
  it('android: native, payments allowed', () => {
    mockPlatform = 'android';
    expect(isNative()).toBe(true);
    expect(isIOSApp()).toBe(false);
    expect(canPayInApp()).toBe(true);
  });
  it('ios: native, payments blocked (Apple 3.1.1)', () => {
    mockPlatform = 'ios';
    expect(isNative()).toBe(true);
    expect(isIOSApp()).toBe(true);
    expect(canPayInApp()).toBe(false);
  });
});

describe('Apple 3.1.1 — no payment UI in the iOS app', () => {
  beforeEach(() => { mockPlatform = 'web'; });

  it('PaymentDialog renders on web', () => {
    render(<PaymentDialog open onOpenChange={() => {}} />);
    expect(screen.getByText('Pay Subscription')).toBeInTheDocument();
  });
  it('PaymentDialog renders nothing on iOS', () => {
    mockPlatform = 'ios';
    const { container } = render(<PaymentDialog open onOpenChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Pay Subscription')).toBeNull();
  });
  it('SubscriptionWidget shows Renew button on web/android, hidden on iOS', () => {
    const { unmount } = render(<SubscriptionWidget subscription={expired} onPayNow={() => {}} />);
    expect(screen.getByText('Renew Now')).toBeInTheDocument();
    unmount();
    mockPlatform = 'ios';
    render(<SubscriptionWidget subscription={expired} onPayNow={() => {}} />);
    expect(screen.queryByText('Renew Now')).toBeNull();
    expect(screen.queryByText(/Pay/)).toBeNull();
  });
  it('SubscriptionReminder on iOS shows no price and no pay/renew call to action', () => {
    mockPlatform = 'ios';
    render(<SubscriptionReminder open onOpenChange={() => {}} subscription={expired} onPayNow={() => {}} />);
    expect(screen.queryByText(/TZS/)).toBeNull();
    expect(screen.queryByText('Renew Now')).toBeNull();
    expect(screen.queryByText('Pay Now')).toBeNull();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
  it('SubscriptionReminder on web keeps the price and Renew button', () => {
    render(<SubscriptionReminder open onOpenChange={() => {}} subscription={expired} onPayNow={() => {}} />);
    expect(screen.getByText('TZS 5,000')).toBeInTheDocument();
    expect(screen.getByText('Renew Now')).toBeInTheDocument();
  });
});
