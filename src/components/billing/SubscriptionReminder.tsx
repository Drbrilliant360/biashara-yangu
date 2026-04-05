
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, Clock, Crown, CreditCard } from 'lucide-react';
import type { SubscriptionInfo } from '@/hooks/useSubscription';

interface SubscriptionReminderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: SubscriptionInfo;
  onPayNow: () => void;
}

export const SubscriptionReminder: React.FC<SubscriptionReminderProps> = ({
  open,
  onOpenChange,
  subscription,
  onPayNow,
}) => {
  const { daysRemaining, isExpired, isTrial, isWarning } = subscription;

  const getContent = () => {
    if (isExpired) {
      return {
        icon: <XCircle className="h-12 w-12 text-destructive" />,
        title: 'Your Subscription Has Expired',
        description:
          'Your access to Biashara Yangu has expired. Please renew your subscription to continue managing your business.',
        bgClass: 'bg-destructive/10',
        canDismiss: false,
      };
    }
    if (isWarning && isTrial) {
      return {
        icon: <Clock className="h-12 w-12 text-orange-500" />,
        title: `Free Trial Ending in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}!`,
        description:
          'Your free trial is almost over. Subscribe now to keep using all features without interruption.',
        bgClass: 'bg-orange-100 dark:bg-orange-950/30',
        canDismiss: true,
      };
    }
    if (isWarning) {
      return {
        icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
        title: `Subscription Expiring in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}!`,
        description:
          'Your subscription is about to expire. Renew now to avoid any interruption to your business operations.',
        bgClass: 'bg-orange-100 dark:bg-orange-950/30',
        canDismiss: true,
      };
    }
    return {
      icon: <Crown className="h-12 w-12 text-primary" />,
      title: 'Welcome to Biashara Yangu!',
      description: `You have ${daysRemaining} days remaining in your free trial. Enjoy exploring all features!`,
      bgClass: 'bg-primary/10',
      canDismiss: true,
    };
  };

  const content = getContent();

  return (
    <Dialog open={open} onOpenChange={content.canDismiss ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-center">{content.title}</DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <div className={`w-20 h-20 rounded-full ${content.bgClass} flex items-center justify-center`}>
            {content.icon}
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Monthly Subscription</p>
            <p className="text-3xl font-bold">TZS 5,000</p>
          </div>

          {daysRemaining > 0 && !isExpired && (
            <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {content.canDismiss && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {isWarning ? 'Remind Later' : 'Maybe Later'}
            </Button>
          )}
          <Button
            className="flex-1 gap-2"
            variant={isExpired ? 'destructive' : 'default'}
            onClick={() => {
              onOpenChange(false);
              onPayNow();
            }}
          >
            <CreditCard className="h-4 w-4" />
            {isExpired ? 'Renew Now' : 'Pay Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
