import * as React from 'react';
import { AlertCircle } from 'lucide-react';

/** Inline message shown under an invalid field. Pair with aria-invalid on the input. */
export const FieldError: React.FC<{ id?: string; message?: string }> = ({ id, message }) => {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 flex items-start gap-1 text-xs font-medium text-destructive">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
};

/** Props to spread onto an <Input> so it turns red and is announced as invalid. */
export const invalidProps = (name: string, message?: string) =>
  message
    ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-error`, className: 'border-destructive focus-visible:ring-destructive' }
    : {};
