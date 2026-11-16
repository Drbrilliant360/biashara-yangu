/**
 * Turn any thrown value (Supabase error, network error, edge-function error)
 * into a short message a shop owner can act on.
 */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You are offline. Check your internet connection and try again.';
  }
  const e = err as { message?: string; code?: string; status?: number; details?: string } | null | undefined;
  const msg = (e?.message || '').toLowerCase();

  if (!e) return fallback;
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed') || msg.includes('load failed')) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  if (msg.includes('jwt expired') || msg.includes('invalid jwt') || e.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (msg.includes('invalid login credentials')) return 'Wrong email or password. Check them and try again.';
  if (msg.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the link.';
  if (msg.includes('user already registered')) return 'An account with this email already exists. Try signing in instead.';
  if (msg.includes('password should be') || msg.includes('weak password')) return 'Password is too weak. Use at least 8 characters with letters and a number.';
  if (msg.includes('rate limit') || e.status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (e.code === '23505' || msg.includes('duplicate key')) return 'This already exists. Use a different value.';
  if (e.code === '23503' || msg.includes('foreign key')) return 'This item is still used elsewhere, so it cannot be removed.';
  if (e.code === '42501' || msg.includes('row-level security') || msg.includes('permission denied') || e.status === 403) {
    return 'You do not have permission to do this.';
  }
  if (e.status && e.status >= 500) return 'The server had a problem. Please try again in a moment.';
  return fallback;
}
