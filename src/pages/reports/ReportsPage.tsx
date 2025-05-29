
import React, { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useReportsData } from '@/hooks/useReportsData';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { DateRange } from 'react-day-picker';

const ReportsPage: React.FC = () => {
  const { currentShop } = useShop();
  const { t } = useLanguage();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  });

  console.log('Fetching data for date range:', dateRange);

  const {
    sales,
    expenses,
    products,
    totalSales,
    totalExpenses,
    profit,
    dailySales,
    topProducts,
    lowStockProducts,
    isLoading,
  } = useReportsData({
    from: dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: dateRange?.to || new Date(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    console.log('Exporting to PDF...');
  };

  const exportToExcel = () => {
    // Implementation for Excel export
    console.log('Exporting to Excel...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("reports")}</h1>
          <p className="text-muted-foreground">{t("business analytics and insights")}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
            className="w-full sm:w-auto"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total sales")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              {sales.length} {t("transactions")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total expenses")}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} {t("expense entries")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("profit")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {profit >= 0 ? t("profit") : t("loss")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("products")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter(p => p.is_active).length} {t("active")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sales trend")}</CardTitle>
            <CardDescription>{t("daily sales over time")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line 
                  type="monotone" 
                  dataKey="totalSales" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>{t("top products")}</CardTitle>
            <CardDescription>{t("products by stock quantity")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.stock_quantity}</p>
                      <p className="text-sm text-muted-foreground">{t("in stock")}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">{t("no products found")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">{t("low stock alert")}</CardTitle>
            <CardDescription>{t("products running low on stock")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <Badge variant={product.stock_quantity <= 5 ? "destructive" : "secondary"}>
                    {product.stock_quantity} {t("left")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("recent sales")}</CardTitle>
            <CardDescription>{t("latest sales transactions")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sales.length > 0 ? (
                sales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{sale.receipt_number || `Sale #${sale.id.slice(0, 8)}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number(sale.total))}</p>
                      <p className="text-sm text-muted-foreground">{sale.payment_method}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">{t("no sales found")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recent expenses")}</CardTitle>
            <CardDescription>{t("latest expense entries")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.length > 0 ? (
                expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.description || new Date(expense.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">-{formatCurrency(Number(expense.amount))}</p>
                      <p className="text-sm text-muted-foreground">{t("expense")}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">{t("no expenses found")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
