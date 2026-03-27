
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ForgotPasswordFormProps {
  onComplete: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onComplete }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email address</Label>
        <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading || !email}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </DialogFooter>
    </form>
  );
};
