import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const login = vi.fn(async () => false);
const register = vi.fn(async () => false);
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login, register, isAuthenticated: false, loading: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: vi.fn() } } }));

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

const wrap = (ui: React.ReactElement) =>
  render(<HelmetProvider><MemoryRouter>{ui}</MemoryRouter></HelmetProvider>);

describe('Login form', () => {
  it('shows inline instructions and does not call the backend when fields are empty', async () => {
    wrap(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(login).not.toHaveBeenCalled();
  });

  it('submits once valid, showing a loading state so it cannot be double-submitted', async () => {
    let finish!: (v: boolean) => void;
    login.mockImplementationOnce(() => new Promise<boolean>((r) => { finish = r; }));
    wrap(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret1' } });
    const btn = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: /signing in/i }));
    expect(login.mock.calls.length).toBe(1);
    finish(false);
  });
});

describe('Register form', () => {
  it('flags mismatched passwords next to the field', async () => {
    wrap(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Amina Juma' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'amina@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
});
