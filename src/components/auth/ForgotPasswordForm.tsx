
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { validate, forgotSchema, type FieldErrors } from '@/lib/validation';
import { FieldError, invalidProps } from '@/components/ui/field-error';
import { friendlyError } from '@/lib/errors';
import { useToast } from '@/components/ui/use-toast';

interface ForgotPasswordFormProps {
  onComplete: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onComplete }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate(forgotSchema, { email });
    setErrors(result.errors);
    if (!result.ok) return;
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Could not send email", description: friendlyError(error, error.message), variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Email Sent", description: "Check your email for password reset instructions." });
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
        </p>
        <Button onClick={onComplete}>Done</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email address</Label>
        <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" {...invalidProps('email', errors.email)} />
        <FieldError id="email-error" message={errors.email} />
      </div>
      <DialogFooter>
        <Button type="submit" loading={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </DialogFooter>
    </form>
  );
};
