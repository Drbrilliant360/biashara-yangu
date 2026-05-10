import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface S { id: string; receipt_number: string | null; total: number; payment_method: string; payment_status: string; customer_name: string | null; created_at: string; shop_id: string; }

const AdminSalesPage: React.FC = () => {
  const [sales, setSales] = useState<S[]>([]);
  const [shops, setShops] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ss }, { data: sh }] = await Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("shops").select("id, name"),
      ]);
      setSales((ss as S[]) ?? []);
      setShops(Object.fromEntries(((sh as any[]) ?? []).map(s => [s.id, s.name])));
      setLoading(false);
    })();
  }, []);

  const total = sales.reduce((a, b) => a + Number(b.total), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Super Admin</h1>
      <p className="text-sm text-muted-foreground mb-4">All sales across all shops (last 500)</p>
      <AdminNav />

      <Card className="p-4 mb-4">
        <div className="text-xs text-muted-foreground">Total volume shown</div>
        <div className="text-xl font-bold">{total.toLocaleString()} TZS</div>
      </Card>

      <Card className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Receipt</TableHead><TableHead>Shop</TableHead><TableHead>Customer</TableHead>
            <TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Date</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-6">Loading…</TableCell></TableRow> :
              sales.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.receipt_number || s.id.slice(0, 8)}</TableCell>
                  <TableCell>{shops[s.shop_id] || "-"}</TableCell>
                  <TableCell>{s.customer_name || "-"}</TableCell>
                  <TableCell>{s.payment_method}</TableCell>
                  <TableCell><Badge variant={s.payment_status === "paid" ? "default" : "outline"}>{s.payment_status}</Badge></TableCell>
                  <TableCell>{Number(s.total).toLocaleString()}</TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminSalesPage;
