import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { canPayInApp } from '@/lib/platform';
import { Progress } from '@/components/ui/progress';
import { validate, paymentSchema, type FieldErrors } from '@/lib/validation';
import { FieldError, invalidProps } from '@/components/ui/field-error';
import { friendlyError } from '@/lib/errors';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

export function PaymentDialog(props: PaymentDialogProps) {
  // Apple 3.1.1: no external payment flows inside the iOS app.
  if (!canPayInApp()) return null;
  return <PaymentDialogInner {...props} />;
}

function PaymentDialogInner({ open, onOpenChange, onPaymentSuccess }: PaymentDialogProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [elapsed, setElapsed] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [reference, setReference] = useState('');
  const pollRef = useRef<number | null>(null);

  const AMOUNT = 5000;

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollStatus = async (ref: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('snippe-check-payment', {
        body: { reference: ref },
      });
      if (error) throw error;
      if (data?.status === 'completed') {
        stopPolling();
        setPaymentStatus('success');
        setPaymentMessage('Payment received. Your subscription has been renewed.');
        onPaymentSuccess?.();
        toast({ title: "Payment Successful", description: "Your subscription is now active." });
      } else if (['failed', 'voided', 'expired'].includes(data?.status)) {
        stopPolling();
        setPaymentStatus('error');
        setPaymentMessage(`Payment ${data.status}. Please try again.`);
      }
    } catch (e) {
      console.error('Poll error:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate(paymentSchema, { firstName, lastName, email, phone });
    setErrors(result.errors);
    if (!result.ok) return;
    setIsLoading(true);
    setElapsed(0);
    try {
      const { data, error } = await supabase.functions.invoke('snippe-create-payment', {
        body: { email, phone, firstname: firstName, lastname: lastName, amount: AMOUNT },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setReference(data.reference);
      setPaymentStatus('pending');
      setPaymentMessage('Check your phone and enter your mobile money PIN to authorize the payment.');

      toast({ title: "Payment Initiated", description: "Approve on your phone to complete." });

      // Poll every 4 seconds
      let ticks = 0;
      pollRef.current = window.setInterval(() => {
        ticks += 4;
        setElapsed(ticks);
        if (ticks >= 180) {
          stopPolling();
          setPaymentStatus('error');
          setPaymentMessage('We did not get a confirmation in time. If money left your account it will be applied shortly. Check Settings > Billing, or contact support.');
          return;
        }
        pollStatus(data.reference);
      }, 4000);
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentStatus('error');
      const msg = friendlyError(err, 'Could not start the payment. Check your phone number and try again.');
      setPaymentMessage(msg);
      toast({ title: "Payment Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    stopPolling();
    setPaymentStatus('idle');
    setPaymentMessage('');
    setReference('');
  };

  const handleCloseDialog = () => {
    if (!isLoading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'pending':
        return (
          <div className="space-y-6 py-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <Clock className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-yellow-800">{paymentMessage}</AlertDescription>
            </Alert>
            <ol className="space-y-2 text-sm" aria-label="Payment progress">
              <li className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-4 w-4" /> 1. Request sent</li>
              <li className="flex items-center gap-2 font-medium"><Loader2 className="h-4 w-4 animate-spin text-primary" /> 2. Approve on your phone (enter your PIN)</li>
              <li className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> 3. Confirmation and renewal</li>
            </ol>
            <Progress value={Math.min(90, 20 + elapsed)} className="h-2" aria-label="Waiting for confirmation" />
            <p className="text-xs text-muted-foreground">Waiting for confirmation... {elapsed}s. Do not close this window.</p>
            <div className="text-sm text-muted-foreground">
              <p>Reference: {reference}</p>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="space-y-6 py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800">{paymentMessage}</AlertDescription>
            </Alert>
            <Button className="w-full" onClick={handleCloseDialog}>Close</Button>
          </div>
        );
      case 'error':
        return (
          <div className="space-y-6 py-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800">{paymentMessage}</AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={resetForm}>Try Again</Button>
          </div>
        );
      default:
        return (
          <form onSubmit={handleSubmit} className="space-y-4 py-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} {...invalidProps('firstName', errors.firstName)} />
                <FieldError id="firstName-error" message={errors.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} {...invalidProps('lastName', errors.lastName)} />
                <FieldError id="lastName-error" message={errors.lastName} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" disabled={isLoading} {...invalidProps('email', errors.email)} />
              <FieldError id="email-error" message={errors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Money Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0781000000" disabled={isLoading} {...invalidProps('phone', errors.phone)} />
              <FieldError id="phone-error" message={errors.phone} />
              <p className="text-xs text-muted-foreground">Airtel Money, M-Pesa, Mixx by Yas, or Halotel</p>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full" loading={isLoading}>
                {isLoading ? "Processing..." : `Pay Now (TZS ${AMOUNT.toLocaleString()})`}
              </Button>
            </DialogFooter>
          </form>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pay Subscription</DialogTitle>
          <DialogDescription>
            Pay TZS {AMOUNT.toLocaleString()} via mobile money to renew your subscription for 30 days.
          </DialogDescription>
        </DialogHeader>
        {renderPaymentStatus()}
      </DialogContent>
    </Dialog>
  );
}
