
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  ArrowRight, 
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useShop } from '@/context/ShopContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionWidget } from '@/components/billing/SubscriptionWidget';

import { SubscriptionReminder } from '@/components/billing/SubscriptionReminder';
import { PaymentDialog } from '@/components/billing/PaymentDialog';

const DashboardPage: React.FC = () => {
  const { currentShop } = useShop();
  const navigate = useNavigate();
  const {
    subscription,
    showReminder,
    setShowReminder,
    showPayment,
    setShowPayment,
    extendSubscription,
  } = useSubscription();
  const shopId = currentShop?.id;

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['dashboard-products', shopId],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('shop_id', shopId!).eq('is_active', true);
      return data || [];
    },
    enabled: !!shopId,
  });

  // Fetch all sales
  const { data: sales = [] } = useQuery({
    queryKey: ['dashboard-sales', shopId],
    queryFn: async () => {
      const { data } = await supabase.from('sales').select('*').eq('shop_id', shopId!).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!shopId,
  });

  // Fetch sale items with product buying prices for COGS calculation
  const { data: monthlySaleItems = [] } = useQuery({
    queryKey: ['dashboard-sale-items', shopId],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: monthSales } = await supabase
        .from('sales')
        .select('id')
        .eq('shop_id', shopId!)
        .gte('created_at', startOfMonth);
      if (!monthSales || monthSales.length === 0) return [];
      const saleIds = monthSales.map(s => s.id);
      const { data: items } = await supabase
        .from('sale_items')
        .select('quantity, unit_price, product_id')
        .in('sale_id', saleIds);
      return items || [];
    },
    enabled: !!shopId,
  });

  // Fetch product buying prices for COGS
  const { data: productCostMap = {} } = useQuery({
    queryKey: ['dashboard-product-costs', shopId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, buying_price')
        .eq('shop_id', shopId!);
      const map: Record<string, number> = {};
      (data || []).forEach(p => { map[p.id] = Number(p.buying_price); });
      return map;
    },
    enabled: !!shopId,
  });

  // Fetch expenses (this month)
  const { data: expenses = [] } = useQuery({
    queryKey: ['dashboard-expenses', shopId],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data } = await supabase.from('expenses').select('*').eq('shop_id', shopId!).gte('created_at', startOfMonth);
      return data || [];
    },
    enabled: !!shopId,
  });

  // Fetch purchases (this month)
  const { data: purchases = [] } = useQuery({
    queryKey: ['dashboard-purchases', shopId],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data } = await supabase.from('purchases').select('*').eq('shop_id', shopId!).gte('created_at', startOfMonth);
      return data || [];
    },
    enabled: !!shopId,
  });

  // Today's sales
  const todayStr = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.created_at).toDateString() === todayStr);
  const todayRevenue = todaySales.reduce((t, s) => t + Number(s.total), 0);

  // This month totals
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlySales = sales.filter(s => new Date(s.created_at) >= startOfMonth);
  const monthlyRevenue = monthlySales.reduce((t, s) => t + Number(s.total), 0);
  const monthlyExpenses = expenses.reduce((t, e) => t + Number(e.amount), 0);
  const monthlyPurchases = purchases.reduce((t, p) => t + Number(p.total_amount), 0);

  // COGS: sum of (buying_price × quantity) for each sold item
  const monthlyCOGS = monthlySaleItems.reduce((total, item) => {
    const cost = productCostMap[item.product_id] ?? 0;
    return total + cost * item.quantity;
  }, 0);

  const grossProfit = monthlyRevenue - monthlyCOGS;
  const monthlyProfit = grossProfit - monthlyExpenses - monthlyPurchases;

  // Recent sales & low stock
  const recentSales = sales.slice(0, 5);
  const lowStockProducts = products
    .filter(p => p.stock_quantity < p.min_stock_level)
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You need to add a shop before you can view the dashboard.
        </p>
        <Button onClick={() => navigate('/shops/add')}>Add Your First Shop</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{currentShop?.name ? ` — ${currentShop.name}` : ''}
          </p>
        </div>
        <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 px-3 py-1.5 rounded-full">
          <Calendar size={14} />
          {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Registration fee notice */}
      <RegistrationFeeBanner subscription={subscription} />

      {/* Subscription Status */}
      <SubscriptionWidget
        subscription={subscription}
        onPayNow={() => setShowPayment(true)}
      />

      <SubscriptionReminder
        open={showReminder}
        onOpenChange={setShowReminder}
        subscription={subscription}
        onPayNow={() => setShowPayment(true)}
      />

      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        onPaymentSuccess={extendSubscription}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Today's Sales", value: formatCurrency(todayRevenue), sub: `${todaySales.length} transactions`, Icon: DollarSign, tone: 'bg-primary/10 text-primary', valueClass: '' },
          { label: 'Monthly Revenue', value: formatCurrency(monthlyRevenue), sub: `${monthlySales.length} sales this month`, Icon: TrendingUp, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300', valueClass: '' },
          { label: 'Monthly Expenses', value: formatCurrency(monthlyExpenses), sub: `${expenses.length} entries`, Icon: TrendingDown, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', valueClass: '' },
          {
            label: 'Monthly Profit',
            value: formatCurrency(monthlyProfit),
            sub: monthlyProfit >= 0 ? 'Profit this month' : 'Loss this month',
            Icon: Wallet,
            tone: monthlyProfit >= 0
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
            valueClass: monthlyProfit >= 0 ? 'text-emerald-600' : 'text-red-600',
          },
        ].map(({ label, value, sub, Icon, tone, valueClass }) => (
          <Card key={label} className="p-4 hover:shadow-md transition-shadow border-border/70">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
                <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${valueClass}`}>{value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>
              </div>
              <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                <Icon size={18} />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Profit Breakdown */}
      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">Monthly Profit Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Revenue</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(monthlyRevenue)}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Cost of Goods</p>
            <p className="text-xl font-bold text-amber-600">-{formatCurrency(monthlyCOGS)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Purchases</p>
            <p className="text-xl font-bold text-blue-600">-{formatCurrency(monthlyPurchases)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Expenses</p>
            <p className="text-xl font-bold text-red-600">-{formatCurrency(monthlyExpenses)}</p>
          </div>
          <div className={`rounded-lg p-4 text-center ${monthlyProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
            <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
            <p className={`text-xl font-bold ${monthlyProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(monthlyProfit)}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Gross Profit (Revenue - COGS):</span>
            <span className={`font-medium ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(grossProfit)}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Recent Sales</h2>
            <Button variant="ghost" className="h-8 text-sm gap-1" onClick={() => navigate('/sales')}>
              View all <ArrowRight size={14} />
            </Button>
          </div>
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="bg-muted/50 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <div className="font-medium">{formatCurrency(Number(sale.total))}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sale.created_at).toLocaleTimeString()} • Receipt #{sale.receipt_number || sale.id.slice(0, 8)}
                    </div>
                  </div>
                  <div className="text-sm">{sale.payment_method}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No sales recorded yet</p>
              <Button variant="link" className="mt-2" onClick={() => navigate('/sales')}>View sales</Button>
            </div>
          )}
        </Card>

        {/* Low Stock Products */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Low Stock Products</h2>
            <Button variant="ghost" className="h-8 text-sm gap-1" onClick={() => navigate('/products')}>
              View all <ArrowRight size={14} />
            </Button>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="bg-muted/50 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.barcode || 'No barcode'} • {formatCurrency(product.selling_price)}
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${product.stock_quantity <= 5 ? 'text-destructive' : 'text-orange-500'}`}>
                    {product.stock_quantity} in stock
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="text-center py-6 text-muted-foreground"><p>No low stock products</p></div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No products added yet</p>
              <Button variant="link" className="mt-2" onClick={() => navigate('/products/add')}>Add your first product</Button>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-24 flex-col border-dashed" onClick={() => navigate('/products/add')}>
          <Package className="h-8 w-8 mb-2" /><span>Add Products</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col border-dashed" onClick={() => navigate('/customers')}>
          <Users className="h-8 w-8 mb-2" /><span>Manage Customers</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col border-dashed" onClick={() => navigate('/reports')}>
          <ArrowUpRight className="h-8 w-8 mb-2" /><span>View Reports</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;
