
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Product, Sale, Expense } from '@/types';

export const useReportsData = (dateRange: { from: Date; to: Date }) => {
  const { user } = useAuth();
  
  // Fetch sales data
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching sales:', error);
        return [];
      }
      
      return data as Sale[];
    },
    enabled: !!user?.id,
  });

  // Fetch expenses data
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching expenses:', error);
        return [];
      }
      
      return data as Expense[];
    },
    enabled: !!user?.id,
  });

  // Fetch products data
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      
      return data as Product[];
    },
    enabled: !!user?.id,
  });

  // Calculate totals
  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
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
  }, {} as Record<string, any>);

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
    products,
    totalSales,
    totalExpenses,
    profit,
    dailySales: Object.values(dailySales),
    topProducts,
    lowStockProducts,
    isLoading: salesLoading || expensesLoading || productsLoading,
  };
};
