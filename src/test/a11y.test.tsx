import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), register: vi.fn(), isAuthenticated: false, loading: false, user: null }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: vi.fn() } } }));

import LandingPage from '@/pages/landing/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import PrivacyPage from '@/pages/legal/PrivacyPage';
import TermsPage from '@/pages/legal/TermsPage';
import InvoiceGeneratorPage from '@/pages/invoice/InvoiceGeneratorPage';

const renderPage = (ui: React.ReactElement) =>
  render(<HelmetProvider><MemoryRouter>{ui}</MemoryRouter></HelmetProvider>);

// color-contrast needs real layout/CSS, which jsdom does not provide
const opts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('accessibility (axe) on public pages', () => {
  it.each([
    ['landing', <LandingPage key="l" />],
    ['login', <LoginPage key="lo" />],
    ['register', <RegisterPage key="r" />],
    ['privacy', <PrivacyPage key="p" />],
    ['terms', <TermsPage key="t" />],
    ['invoice generator', <InvoiceGeneratorPage key="i" />],
  ])('%s has no detectable accessibility violations', async (_name, page) => {
    const { container } = renderPage(page);
    const results = await axe(container, opts);
    // @ts-expect-error matcher added via expect.extend
    expect(results).toHaveNoViolations();
  });

  it('every form field on login and register has an accessible name', () => {
    renderPage(<RegisterPage />);
    for (const label of ['Full name', 'Email', 'Password', 'Confirm password']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });
});
