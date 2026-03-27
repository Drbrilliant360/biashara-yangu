
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';

interface ReportProduct {
  id: string;
  name: string;
  category?: string;
  stock_quantity: number;
  selling_price: number;
  is_active: boolean;
}

interface ReportSale {
  id: string;
  receipt_number?: string;
  total: number;
  payment_method: string;
  created_at: string;
}

interface ReportExpense {
  id: string;
  category: string;
  description?: string;
  amount: number;
  created_at: string;
}

interface ReportPurchase {
  id: string;
  supplier_name?: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  purchase_date: string;
  created_at: string;
}

export const useReportsData = (dateRange: { from: Date; to: Date }) => {
  const { user } = useAuth();
  const { currentShop } = useShop();
  
  // Fetch sales data
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', currentShop?.id, dateRange],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('shop_id', currentShop.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching sales:', error);
        return [];
      }
      
      return (data || []) as ReportSale[];
    },
    enabled: !!currentShop?.id,
  });

  // Fetch expenses data
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['report-expenses', currentShop?.id, dateRange],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('shop_id', currentShop.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching expenses:', error);
        return [];
      }
      
      return (data || []) as ReportExpense[];
    },
    enabled: !!currentShop?.id,
  });

  // Fetch purchases data
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['report-purchases', currentShop?.id, dateRange],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('shop_id', currentShop.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching purchases:', error);
        return [];
      }
      
      return (data || []) as ReportPurchase[];
    },
    enabled: !!currentShop?.id,
  });

  // Fetch products data
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['report-products', currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', currentShop.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      
      return (data || []) as ReportProduct[];
    },
    enabled: !!currentShop?.id,
  });

  // Calculate totals
  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total_amount), 0);
  const profit = totalSales - totalExpenses;

  // Calculate daily sales for chart
  const dailySales = sales.reduce((acc, sale) => {
    const date = new Date(sale.created_at).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, totalSales: 0, transactions: 0 };
    }
    acc[date].totalSales += Number(sale.total);
    acc[date].transactions += 1;
    return acc;
  }, {} as Record<string, { date: string; totalSales: number; transactions: number }>);

  // Top selling products
  const topProducts = products
    .filter(p => p.is_active)
    .sort((a, b) => b.stock_quantity - a.stock_quantity)
    .slice(0, 5);

  // Low stock products
  const lowStockProducts = products
    .filter(p => p.is_active && p.stock_quantity <= 10)
    .sort((a, b) => a.stock_quantity - b.stock_quantity);

  return {
    sales,
    expenses,
    purchases,
    products,
    totalSales,
    totalExpenses,
    totalPurchases,
    profit,
    dailySales: Object.values(dailySales),
    topProducts,
    lowStockProducts,
    isLoading: salesLoading || expensesLoading || purchasesLoading || productsLoading,
  };
};
