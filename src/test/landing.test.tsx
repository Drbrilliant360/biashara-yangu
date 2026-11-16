import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

let native = false;
let authed = false;
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => native, getPlatform: () => (native ? 'ios' : 'web') },
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: authed, loading: false }),
}));
vi.mock('@/components/layout/Sidebar', () => ({ Sidebar: () => <div>SIDEBAR</div> }));
vi.mock('@/components/layout/TopBar', () => ({ TopBar: () => <div>TOPBAR</div> }));
vi.mock('@/components/layout/MobileBottomNav', () => ({ MobileBottomNav: () => <div>BOTTOMNAV</div> }));

import { MainLayout } from '@/components/layout/MainLayout';

const renderAt = (path: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>DASHBOARD</div>} />
            <Route path="products" element={<div>PRODUCTS</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

describe('landing page routing', () => {
  beforeEach(() => { native = false; authed = false; });

  it('web, signed out at "/": shows the landing page with sign-up and sign-in links', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: /Run every shop from one simple app/i })).toBeInTheDocument();
    const trial = screen.getAllByRole('link', { name: /Start (your )?free trial/i });
    expect(trial.length).toBeGreaterThan(0);
    trial.forEach((a) => expect(a).toHaveAttribute('href', '/register'));
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getByText('TZS 5,000')).toBeInTheDocument();
    expect(screen.queryByText('DASHBOARD')).toBeNull();
  });

  it('web, signed out at a protected page: redirects to login', () => {
    renderAt('/products');
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
  });

  it('native app, signed out at "/": goes to login, never the marketing page', () => {
    native = true;
    renderAt('/');
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
  });

  it('signed in at "/": shows the dashboard, not the landing page', () => {
    authed = true;
    renderAt('/');
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.queryByText(/Run every shop/i)).toBeNull();
  });
});
