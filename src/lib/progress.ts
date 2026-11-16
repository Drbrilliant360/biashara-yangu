import { toast } from 'sonner';
import { friendlyError } from '@/lib/errors';

/**
 * Show a progress toast for a long-running task (export, upload, report build):
 * spinner while running, then a success or a clear error.
 */
export function runWithProgress<T>(
  task: () => Promise<T>,
  messages: { loading: string; success: string; error?: string },
): Promise<T> {
  const promise = task();
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: (e) => friendlyError(e, messages.error ?? 'That did not work. Please try again.'),
  });
  return promise;
}
