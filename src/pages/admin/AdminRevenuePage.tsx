import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Download } from "lucide-react";

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const AdminRevenuePage: React.FC = () => {
  const [data, setData] = useState<{ month: string; revenue: number }[]>([]);
  const [topPayers, setTopPayers] = useState<{ name: string; amount: number; count: number }[]>([]);
  const [lifetime, setLifetime] = useState(0);
  const [conversion, setConversion] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: subs }, { data: profs }] = await Promise.all([
        supabase.from("subscriptions").select("*"),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      const profMap = Object.fromEntries(((profs as any[]) ?? []).map(p => [p.user_id, p.full_name || "-"]));
      const months: string[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
      const map: Record<string, number> = Object.fromEntries(months.map(m => [m, 0]));
      const byUser: Record<string, { amount: number; count: number }> = {};
      let life = 0;
      ((subs as any[]) ?? []).forEach(s => {
        if (s.status === "active" && s.last_payment_date) {
          const k = monthKey(new Date(s.last_payment_date));
          if (k in map) map[k] += Number(s.amount ?? 0);
          life += Number(s.amount ?? 0);
          (byUser[s.user_id] ||= { amount: 0, count: 0 });
          byUser[s.user_id].amount += Number(s.amount ?? 0);
          byUser[s.user_id].count += 1;
        }
      });
      const total = (subs as any[])?.length ?? 0;
      const active = ((subs as any[]) ?? []).filter(s => s.status === "active").length;
      setConversion(total ? Math.round((active / total) * 100) : 0);
      setLifetime(life);
      setData(months.map(m => ({ month: m.slice(5), revenue: map[m] })));
      setTopPayers(Object.entries(byUser).map(([uid, v]) => ({ name: profMap[uid] || uid.slice(0, 8), ...v })).sort((a, b) => b.amount - a.amount).slice(0, 10));
    })();
  }, []);

  const exportCsv = () => {
    const csv = ["Month,Revenue", ...data.map(d => `${d.month},${d.revenue}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "platform-revenue.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Super Admin</h1>
      <p className="text-sm text-muted-foreground mb-4">Platform revenue analytics</p>
      <AdminNav />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Lifetime Revenue</div><div className="text-xl font-bold">{lifetime.toLocaleString()} TZS</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Trial → Active Conversion</div><div className="text-xl font-bold">{conversion}%</div></Card>
        <Card className="p-4 flex items-center justify-between"><div><div className="text-xs text-muted-foreground">Export</div><div className="text-sm">Monthly revenue CSV</div></div><Button size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-1" />CSV</Button></Card>
      </div>

      <Card className="p-4 mb-4">
        <h3 className="font-medium mb-3">Monthly Revenue</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-0">
        <div className="p-4 border-b font-medium">Top Paying Users</div>
        <Table>
          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Payments</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
          <TableBody>
            {topPayers.map((p, i) => (
              <TableRow key={i}><TableCell>{p.name}</TableCell><TableCell>{p.count}</TableCell><TableCell className="text-right">{p.amount.toLocaleString()} TZS</TableCell></TableRow>
            ))}
            {topPayers.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No payments yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminRevenuePage;
