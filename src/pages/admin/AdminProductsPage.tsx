import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface P { id: string; name: string; sku: string | null; category: string | null; selling_price: number; buying_price: number; stock_quantity: number; shop_id: string; is_active: boolean; }

const AdminProductsPage: React.FC = () => {
  const [items, setItems] = useState<P[]>([]);
  const [shops, setShops] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: ps }, { data: sh }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("shops").select("id, name"),
    ]);
    setItems((ps as P[]) ?? []);
    setShops(Object.fromEntries(((sh as any[]) ?? []).map(s => [s.id, s.name])));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("Delete product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" }); load();
  };

  const filtered = items.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Super Admin</h1>
      <p className="text-sm text-muted-foreground mb-4">All products across all shops</p>
      <AdminNav />

      <div className="mb-4 relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input placeholder="Search products…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Product</TableHead><TableHead>Shop</TableHead><TableHead>SKU</TableHead>
            <TableHead>Buy</TableHead><TableHead>Sell</TableHead><TableHead>Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-6">Loading…</TableCell></TableRow> :
              filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{shops[p.shop_id] || "-"}</TableCell>
                  <TableCell>{p.sku || "-"}</TableCell>
                  <TableCell>{Number(p.buying_price).toLocaleString()}</TableCell>
                  <TableCell>{Number(p.selling_price).toLocaleString()}</TableCell>
                  <TableCell>{p.stock_quantity}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminProductsPage;
