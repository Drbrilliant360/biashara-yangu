import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/AdminNav";
import { Store, Users, CreditCard, TrendingUp, Package, ShoppingCart, DollarSign, Activity } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

interface Stats {
  totalShops: number;
  activeShops: number;
  totalUsers: number;
  trial: number;
  active: number;
  expired: number;
  cancelled: number;
  lifetimeRevenue: number;
  mrr: number;
  totalSales: number;
  totalProfit: number;
  monthlyRevenue: { month: string; revenue: number }[];
  shopsPerMonth: { month: string; shops: number }[];
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const AdminOverviewPage: React.FC = () => {
  const [s, setS] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [shopsRes, profilesRes, subsRes, salesRes, saleItemsRes, productsRes] = await Promise.all([
        supabase.from("shops").select("id, is_active, created_at"),
        supabase.from("profiles").select("id"),
        supabase.from("subscriptions").select("status, amount, last_payment_date, created_at"),
        supabase.from("sales").select("total"),
        supabase.from("sale_items").select("quantity, unit_price, product_id"),
        supabase.from("products").select("id, buying_price"),
      ]);

      const shops = shopsRes.data ?? [];
      const subs = (subsRes.data ?? []) as any[];
      const sales = salesRes.data ?? [];
      const saleItems = (saleItemsRes.data ?? []) as any[];
      const products = (productsRes.data ?? []) as any[];

      const buyMap = new Map(products.map((p) => [p.id, Number(p.buying_price ?? 0)]));
      const totalProfit = saleItems.reduce(
        (acc, it) => acc + (Number(it.unit_price) - (buyMap.get(it.product_id) ?? 0)) * Number(it.quantity),
        0
      );

      // Per-month revenue (last 12)
      const months: string[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(monthKey(d));
      }
      const revenueByMonth: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
      const shopsByMonth: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
      subs.forEach((sub) => {
        if (sub.last_payment_date && sub.status === "active") {
          const k = monthKey(new Date(sub.last_payment_date));
          if (k in revenueByMonth) revenueByMonth[k] += Number(sub.amount ?? 0);
        }
      });
      shops.forEach((sh: any) => {
        const k = monthKey(new Date(sh.created_at));
        if (k in shopsByMonth) shopsByMonth[k] += 1;
      });

      const lifetimeRevenue = subs
        .filter((x) => x.status === "active" && x.last_payment_date)
        .reduce((a, b) => a + Number(b.amount ?? 0), 0);
      const activeCount = subs.filter((x) => x.status === "active").length;

      setS({
        totalShops: shops.length,
        activeShops: shops.filter((sh: any) => sh.is_active).length,
        totalUsers: profilesRes.data?.length ?? 0,
        trial: subs.filter((x) => x.status === "trial").length,
        active: activeCount,
        expired: subs.filter((x) => x.status === "expired").length,
        cancelled: subs.filter((x) => x.status === "cancelled").length,
        lifetimeRevenue,
        mrr: activeCount * 5000,
        totalSales: sales.reduce((a, b: any) => a + Number(b.total ?? 0), 0),
        totalProfit,
        monthlyRevenue: months.map((m) => ({ month: m.slice(5), revenue: revenueByMonth[m] })),
        shopsPerMonth: months.map((m) => ({ month: m.slice(5), shops: shopsByMonth[m] })),
      });
      setLoading(false);
    })();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat().format(Math.round(n));

  const kpis = s
    ? [
        { label: "Total Shops", value: `${s.totalShops}`, sub: `${s.activeShops} active`, icon: Store },
        { label: "Total Users", value: `${s.totalUsers}`, sub: "registered", icon: Users },
        { label: "Active Subscribers", value: `${s.active}`, sub: `${s.trial} on trial`, icon: CreditCard },
        { label: "MRR", value: `${fmt(s.mrr)} TZS`, sub: `${s.active} × 5,000`, icon: Activity },
        { label: "Lifetime Revenue", value: `${fmt(s.lifetimeRevenue)} TZS`, sub: "from subscriptions", icon: DollarSign },
        { label: "Total Sales Volume", value: `${fmt(s.totalSales)} TZS`, sub: "across all shops", icon: ShoppingCart },
        { label: "Platform Profit", value: `${fmt(s.totalProfit)} TZS`, sub: "sale margin", icon: TrendingUp },
        { label: "Expired / Cancelled", value: `${s.expired + s.cancelled}`, sub: `${s.expired} expired`, icon: Package },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Super Admin</h1>
        <p className="text-sm text-muted-foreground">Platform-wide management for Biashara Yangu</p>
      </div>
      <AdminNav />

      {loading || !s ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            {kpis.map((k) => (
              <Card key={k.label} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                  <k.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-xl font-bold">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.sub}</div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Revenue (last 12 months)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={s.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-4">New Shops (last 12 months)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={s.shopsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="shops" stroke="hsl(var(--primary))" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOverviewPage;
