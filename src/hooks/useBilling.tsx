
import { useState, useEffect } from 'react';
import { STORAGE_KEYS, getItem, setItem } from '@/lib/storage';
import { useToast } from './use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard } from 'lucide-react';

interface SubscriptionData {
  startDate: string;
  expiryDate: string;
  status: 'active' | 'warning' | 'expired';
  lastPaymentDate?: string;
}

// Storage key for billing data
const BILLING_STORAGE_KEY = 'biashara_subscription';

export function useBilling() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(30);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();

  const getSubscriptionStatus = (expiryDate: Date): 'active' | 'warning' | 'expired' => {
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) return 'expired';
    if (daysUntilExpiry <= 5) return 'warning';
    return 'active';
  };
  
  const initializeSubscription = () => {
    // Try to get existing subscription data
    const storedData = getItem<SubscriptionData | null>(BILLING_STORAGE_KEY, null);
    
    if (storedData) {
      const expiryDate = new Date(storedData.expiryDate);
      const status = getSubscriptionStatus(expiryDate);
      const days = Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
      
      setSubscriptionData({
        ...storedData,
        status
      });
      setDaysRemaining(days);
      
      // Show reminder if status is warning or expired
      if (status === 'warning' || status === 'expired') {
        setIsReminderOpen(true);
      }
    } else {
      // Create new subscription starting today with 30-day trial
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(startDate.getDate() + 30);
      
      const newSubscription: SubscriptionData = {
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'active'
      };
      
      setSubscriptionData(newSubscription);
      setDaysRemaining(30);
      setItem(BILLING_STORAGE_KEY, newSubscription);
      
      // Show toast for new users
      toast({
        title: "Welcome to Biashara Yangu!",
        description: "Your 30-day trial period has started."
      });
    }
  };
  
  useEffect(() => {
    initializeSubscription();
    
    // Add a daily check for subscription status
    const dailyCheck = setInterval(() => {
      if (subscriptionData) {
        const expiryDate = new Date(subscriptionData.expiryDate);
        const status = getSubscriptionStatus(expiryDate);
        const days = Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        
        setSubscriptionData({
          ...subscriptionData,
          status
        });
        setDaysRemaining(days);
        
        if (days === 5) {
          setIsReminderOpen(true);
          toast({
            title: "Subscription Expiring Soon",
            description: "Your subscription will expire in 5 days. Please renew to avoid interruption.",
            variant: "destructive"
          });
        }
      }
    }, 1000 * 60 * 60 * 24); // Check once per day
    
    return () => {
      clearInterval(dailyCheck);
    };
  }, []);
  
  const PaymentReminder = () => (
    <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subscription Reminder</DialogTitle>
          <DialogDescription>
            {daysRemaining <= 0 
              ? "Your subscription has expired. Please renew to continue using all features." 
              : `Your subscription will expire in ${daysRemaining} days. Please renew to avoid interruption.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">Monthly Subscription</p>
            <p className="text-2xl font-bold">TZS 10,000</p>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Payment will be sent to Bryan Kachocho (0710698702)
          </p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setIsReminderOpen(false)}
          >
            Later
          </Button>
          <Button 
            className="flex-1"
            onClick={() => {
              setIsReminderOpen(false);
              setIsPaymentDialogOpen(true);
            }}
          >
            Pay Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  
  // Render the PaymentReminder component when needed
  useEffect(() => {
    if (isReminderOpen) {
      document.body.appendChild(document.createElement('div')).id = 'payment-reminder-root';
      return () => {
        const reminderRoot = document.getElementById('payment-reminder-root');
        if (reminderRoot) {
          document.body.removeChild(reminderRoot);
        }
      };
    }
  }, [isReminderOpen]);
  
  return {
    daysRemaining,
    subscriptionStatus: subscriptionData?.status || 'active',
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    PaymentReminder
  };
}
