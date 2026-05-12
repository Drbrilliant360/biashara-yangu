import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Receipt, ArrowUpRight, XCircle, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";

interface Event {
  id: string; event_type: string; previous_status: string | null; new_status: string | null;
  amount: number | null; receipt_reference: string | null; period_end: string | null;
  notes: string | null; actor_id: string | null; metadata: any; created_at: string;
}

const iconFor = (t: string) => {
  switch (t) {
    case "payment": return <Receipt className="w-4 h-4 text-green-600" />;
    case "trial_extended": return <Clock className="w-4 h-4 text-blue-600" />;
    case "cancelled": return <XCircle className="w-4 h-4 text-destructive" />;
    case "activated": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "expired": return <AlertCircle className="w-4 h-4 text-orange-600" />;
    case "created": return <Plus className="w-4 h-4 text-muted-foreground" />;
    default: return <ArrowUpRight className="w-4 h-4 text-muted-foreground" />;
  }
};

const labelFor = (t: string) =>
  ({ payment: "Payment received", trial_extended: "Trial extended", cancelled: "Cancelled",
     activated: "Activated", expired: "Expired", created: "Subscription created",
     status_changed: "Status changed", updated: "Updated" } as any)[t] ?? t;

interface Props {
  subscriptionId: string | null;
  userName?: string;
  onClose: () => void;
}

export const SubscriptionHistoryDialog: React.FC<Props> = ({ subscriptionId, userName, onClose }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subscriptionId) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("subscription_events" as any)
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false });
      setEvents((data as any[] as Event[]) ?? []);
      setLoading(false);
    })();
  }, [subscriptionId]);

  return (
    <Dialog open={!!subscriptionId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscription History {userName ? `— ${userName}` : ""}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No events recorded yet.</p>
        ) : (
          <ol className="relative border-l ml-3 space-y-4">
            {events.map((e) => (
              <li key={e.id} className="ml-6">
                <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-background border rounded-full">
                  {iconFor(e.event_type)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{labelFor(e.event_type)}</span>
                  {e.previous_status && e.new_status && e.previous_status !== e.new_status && (
                    <Badge variant="outline" className="text-xs">{e.previous_status} → {e.new_status}</Badge>
                  )}
                  {e.amount && <Badge className="text-xs">{Number(e.amount).toLocaleString()} TZS</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(e.created_at).toLocaleString()}
                  {e.period_end && <> · period ends {new Date(e.period_end).toLocaleDateString()}</>}
                </div>
                {e.receipt_reference && (
                  <div className="text-xs mt-1">Receipt: <span className="font-mono">{e.receipt_reference}</span></div>
                )}
                {e.notes && <div className="text-xs mt-1 text-muted-foreground">{e.notes}</div>}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
};
