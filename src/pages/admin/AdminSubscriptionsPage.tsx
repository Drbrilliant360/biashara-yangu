import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { SubscriptionHistoryDialog } from "@/components/admin/SubscriptionHistoryDialog";
import { History } from "lucide-react";

interface Sub {
  id: string; user_id: string; status: string; amount: number;
  trial_start: string; trial_end: string; current_period_end: string;
  last_payment_date: string | null; created_at: string;
  registration_fee: number; registration_fee_paid: boolean;
}

const AdminSubscriptionsPage: React.FC = () => {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [historySub, setHistorySub] = useState<{ id: string; name: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    setSubs((s as Sub[]) ?? []);
    setProfiles(Object.fromEntries(((p as any[]) ?? []).map((x) => [x.user_id, x.full_name || "-"])));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Sub>) => {
    const { error } = await supabase.from("subscriptions").update(patch).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Updated" });
    load();
  };

  const markPaid = async (s: Sub) => {
    const receipt = window.prompt("Receipt / reference number (optional)") ?? "";
    const next = new Date(); next.setDate(next.getDate() + 30);
    const { error } = await supabase.from("subscriptions").update({
      status: "active", last_payment_date: new Date().toISOString(), current_period_end: next.toISOString(),
    } as any).eq("id", s.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    if (receipt.trim()) {
      const { data: latest } = await supabase
        .from("subscription_events" as any)
        .select("id").eq("subscription_id", s.id).eq("event_type", "payment")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (latest && (latest as any).id) {
        await supabase.from("subscription_events" as any).update({ receipt_reference: receipt.trim() }).eq("id", (latest as any).id);
      }
    }
    toast({ title: "Marked as paid" });
    load();
  };
  const extendTrial = (s: Sub, days = 30) => {
    const cur = new Date(s.trial_end || s.current_period_end);
    cur.setDate(cur.getDate() + days);
    update(s.id, { trial_end: cur.toISOString(), current_period_end: cur.toISOString(), status: "trial" } as any);
  };
  const cancel = (s: Sub) => update(s.id, { status: "cancelled" } as any);
  const markFeePaid = (s: Sub) => {
    const receipt = window.prompt("Registration fee receipt / reference (optional)") ?? "";
    update(s.id, {
      registration_fee_paid: true,
      registration_fee_paid_at: new Date().toISOString(),
      registration_fee_receipt: receipt.trim() || null,
    } as any);
  };

  const filtered = filter === "all" ? subs : subs.filter(s => s.status === filter);
  const lifetime = subs.filter(s => s.status === "active" && s.last_payment_date).reduce((a, b) => a + Number(b.amount ?? 0), 0);
  const feeRevenue = subs.filter(s => s.registration_fee_paid).reduce((a, b) => a + Number(b.registration_fee ?? 0), 0);
  const unpaidFees = subs.filter(s => !s.registration_fee_paid).length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Super Admin</h1>
      <p className="text-sm text-muted-foreground mb-4">Subscriptions & billing</p>
      <AdminNav />

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground ml-auto">
          Lifetime revenue: <span className="font-semibold text-foreground">{new Intl.NumberFormat().format(lifetime)} TZS</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <Card className="p-3"><div className="text-xs text-muted-foreground">Registration fees collected</div><div className="text-lg font-semibold">{feeRevenue.toLocaleString()} TZS</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Unpaid registration fees</div><div className="text-lg font-semibold">{unpaidFees}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Active subscribers</div><div className="text-lg font-semibold">{subs.filter(s => s.status === "active").length}</div></Card>
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reg. Fee</TableHead>
              <TableHead>Trial Ends</TableHead>
              <TableHead>Period Ends</TableHead>
              <TableHead>Last Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-6">Loading…</TableCell></TableRow>
            ) : filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{profiles[s.user_id] || s.user_id.slice(0, 8)}</TableCell>
                <TableCell><Badge variant={s.status === "active" ? "default" : "outline"}>{s.status}</Badge></TableCell>
                <TableCell>{Number(s.amount).toLocaleString()} TZS</TableCell>
                <TableCell>
                  {s.registration_fee_paid
                    ? <Badge className="bg-green-600 hover:bg-green-600">Paid</Badge>
                    : <Badge variant="outline" className="border-amber-500 text-amber-600">Unpaid</Badge>}
                </TableCell>
                <TableCell>{s.trial_end ? new Date(s.trial_end).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{new Date(s.current_period_end).toLocaleDateString()}</TableCell>
                <TableCell>{s.last_payment_date ? new Date(s.last_payment_date).toLocaleDateString() : "-"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => setHistorySub({ id: s.id, name: profiles[s.user_id] || s.user_id.slice(0, 8) })}>
                    <History className="w-3.5 h-3.5 mr-1" />History
                  </Button>
                  {!s.registration_fee_paid && (
                    <Button size="sm" variant="outline" onClick={() => markFeePaid(s)}>Mark Fee Paid</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => markPaid(s)}>Mark Paid</Button>
                  <Button size="sm" variant="outline" onClick={() => extendTrial(s, 30)}>+30d Trial</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(s)}>Cancel</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <SubscriptionHistoryDialog
        subscriptionId={historySub?.id ?? null}
        userName={historySub?.name}
        onClose={() => setHistorySub(null)}
      />
    </div>
  );
};

export default AdminSubscriptionsPage;
