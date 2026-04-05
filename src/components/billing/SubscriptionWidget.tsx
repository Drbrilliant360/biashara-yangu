
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, AlertTriangle, XCircle, Clock } from 'lucide-react';
import type { SubscriptionInfo } from '@/hooks/useSubscription';

interface SubscriptionWidgetProps {
  subscription: SubscriptionInfo;
  onPayNow: () => void;
}

export const SubscriptionWidget: React.FC<SubscriptionWidgetProps> = ({
  subscription,
  onPayNow,
}) => {
  const { status, daysRemaining, isTrial, isExpired, isWarning, currentPeriodEnd } = subscription;

  const progressValue = Math.min(100, (daysRemaining / 30) * 100);

  const getStatusConfig = () => {
    if (isExpired) {
      return {
        icon: <XCircle className="h-6 w-6 text-destructive" />,
        title: 'Subscription Expired',
        subtitle: 'Your access has expired. Pay now to continue.',
        borderColor: 'border-l-destructive',
        bgColor: 'bg-destructive/5',
        progressColor: 'bg-destructive',
        textColor: 'text-destructive',
      };
    }
    if (isWarning) {
      return {
        icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
        title: `${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining`,
        subtitle: isTrial ? 'Your free trial is ending soon!' : 'Your subscription is expiring soon!',
        borderColor: 'border-l-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        progressColor: 'bg-orange-500',
        textColor: 'text-orange-600',
      };
    }
    if (isTrial) {
      return {
        icon: <Clock className="h-6 w-6 text-blue-500" />,
        title: `${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Left in Trial`,
        subtitle: 'Enjoy your free trial period!',
        borderColor: 'border-l-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        progressColor: 'bg-blue-500',
        textColor: 'text-blue-600',
      };
    }
    return {
      icon: <Crown className="h-6 w-6 text-primary" />,
      title: `${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining`,
      subtitle: 'Your subscription is active.',
      borderColor: 'border-l-primary',
      bgColor: 'bg-primary/5',
      progressColor: 'bg-primary',
      textColor: 'text-primary',
    };
  };

  const config = getStatusConfig();

  return (
    <Card className={`border-l-4 ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">{config.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-lg ${config.textColor}`}>{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>

            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{isExpired ? 'Expired' : `${daysRemaining} of 30 days`}</span>
                {currentPeriodEnd && !isExpired && (
                  <span>Expires: {currentPeriodEnd.toLocaleDateString()}</span>
                )}
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          </div>
        </div>

        {(isExpired || isWarning || isTrial) && (
          <Button
            size="sm"
            variant={isExpired ? 'destructive' : 'default'}
            onClick={onPayNow}
            className="shrink-0"
          >
            {isExpired ? 'Renew Now' : 'Pay TZS 5,000'}
          </Button>
        )}
      </div>
    </Card>
  );
};
