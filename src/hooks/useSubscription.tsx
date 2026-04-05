
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './use-toast';

export interface SubscriptionInfo {
  status: 'trial' | 'active' | 'expired';
  daysRemaining: number;
  trialEnd: Date | null;
  currentPeriodEnd: Date | null;
  isExpired: boolean;
  isTrial: boolean;
  isWarning: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    status: 'trial',
    daysRemaining: 30,
    trialEnd: null,
    currentPeriodEnd: null,
    isExpired: false,
    isTrial: true,
    isWarning: false,
  });
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const calculateDaysRemaining = (endDate: Date): number => {
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create subscription for existing user
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newSub) processSubscription(newSub);
        return;
      }

      processSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const processSubscription = (data: any) => {
    const periodEnd = new Date(data.current_period_end);
    const trialEnd = new Date(data.trial_end);
    const days = calculateDaysRemaining(periodEnd);
    const isExpired = days <= 0;
    const isTrial = data.status === 'trial';
    const isWarning = days <= 5 && days > 0;

    // Update status in DB if expired
    if (isExpired && data.status !== 'expired') {
      supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('user_id', data.user_id)
        .then();
    }

    const status: 'trial' | 'active' | 'expired' = isExpired ? 'expired' : data.status;

    setSubscription({
      status,
      daysRemaining: days,
      trialEnd,
      currentPeriodEnd: periodEnd,
      isExpired,
      isTrial,
      isWarning,
    });

    // Show reminders
    if (isExpired) {
      setShowReminder(true);
    } else if (isWarning) {
      setShowReminder(true);
    }
  };

  const extendSubscription = async () => {
    if (!user) return false;
    try {
      const now = new Date();
      const { data: current } = await supabase
        .from('subscriptions')
        .select('current_period_end')
        .eq('user_id', user.id)
        .single();

      // Extend from current end date or from now, whichever is later
      const baseDate = current?.current_period_end
        ? new Date(Math.max(new Date(current.current_period_end).getTime(), now.getTime()))
        : now;

      const newEnd = new Date(baseDate);
      newEnd.setDate(newEnd.getDate() + 30);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_end: newEnd.toISOString(),
          last_payment_date: now.toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Subscription Renewed! 🎉",
        description: `Your subscription is now active until ${newEnd.toLocaleDateString()}.`,
      });

      await fetchSubscription();
      return true;
    } catch (err) {
      console.error('Error extending subscription:', err);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check every hour for status changes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSubscription();
    }, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    showReminder,
    setShowReminder,
    showPayment,
    setShowPayment,
    extendSubscription,
    refetch: fetchSubscription,
  };
}
