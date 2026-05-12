import React from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { SubscriptionInfo } from "@/hooks/useSubscription";

interface Props { subscription: SubscriptionInfo; }

export const RegistrationFeeBanner: React.FC<Props> = ({ subscription }) => {
  if (subscription.registrationFeePaid) return null;
  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <h3 className="font-semibold text-amber-700 dark:text-amber-400">
          Registration fee: TZS {subscription.registrationFee.toLocaleString()}
        </h3>
        <p className="text-sm text-muted-foreground">
          A one-time registration fee of TZS {subscription.registrationFee.toLocaleString()} is required for your account.
          Pay through the same channel as your monthly subscription, then notify the admin to confirm.
        </p>
      </div>
    </Card>
  );
};
