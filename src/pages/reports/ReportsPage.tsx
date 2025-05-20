
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { 
  Calendar,
  TrendingUp,
  PieChart,
  Package,
  FileText, 
  FileSpreadsheet, 
  File, 
  Clock,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';
import { useShop } from '@/context/ShopContext';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import { Sale, Product } from '@/types';
import { exportToExcel, exportToPDF, exportToWord, formatDataForExport, ExportableData } from '@/utils/exportUtils';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [activeTab, setActiveTab] = useState('sales');
  const { toast } = useToast();
  
  useEffect(() => {
    if (currentShop) {
      // Load sales data
      const allSales = getItem<Sale[]>(STORAGE_KEYS.SALES, [])
        .filter(sale => sale.shopId === currentShop.id);
      setSales(allSales);
      
      // Load products data
      const allProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, [])
        .filter(product => product.shopId === currentShop.id);
      setProducts(allProducts);
    }
  }, [currentShop]);
  
  // Format currency based on shop settings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Prepare chart data
  const getDailyRevenueData = () => {
    // Define date range
    const endDate = new Date();
    const startDate = subDays(
      endDate, 
      timeRange === 'week' ? 7 : 30
    );
    
    // Create array of dates
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Initialize data with zero values for all dates
    const dailyData = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: dateStr,
        displayDate: format(date, 'MMM dd'),
        revenue: 0,
        transactions: 0
      };
    });
    
    // Fill with actual sales data
    sales.forEach(sale => {
      const saleDate = format(new Date(sale.timestamp), 'yyyy-MM-dd');
      const dataPoint = dailyData.find(d => d.date === saleDate);
      
      if (dataPoint) {
        dataPoint.revenue += sale.total;
        dataPoint.transactions += 1;
      }
    });
    
    return dailyData;
  };
  
  // Get top selling products
  const getTopSellingProducts = () => {
    // Create a map to count sold quantities per product
    const productSales = new Map<string, { name: string, quantity: number, revenue: number }>();
    
    // Process all sales
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productSales.get(item.productId);
        
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          productSales.set(item.productId, {
            name: item.name,
            quantity: item.quantity,
            revenue: item.subtotal
          });
        }
      });
    });
    
    // Convert map to array and sort by quantity
    return Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };
  
  // Calculate total stats
  const calculateStats = () => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    // Get today's sales
    const today = new Date();
    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= startOfDay(today) && saleDate <= endOfDay(today);
    });
    
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const todayTransactions = todaySales.length;
    
    return {
      totalSales,
      totalRevenue,
      totalItems,
      todayRevenue,
      todayTransactions
    };
  };
  
  // Handle exports
  const handleExport = (format: 'excel' | 'pdf' | 'word') => {
    if (!currentShop) {
      toast({
        title: "Export Failed",
        description: "No shop selected.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let exportData: ExportableData = [];
      let fileName = '';
      let reportTitle = '';
      
      // Prepare data based on active tab
      switch (activeTab) {
        case 'sales':
          exportData = formatDataForExport(getDailyRevenueData(), 'sales', formatCurrency);
          fileName = `sales_report_${format(new Date(), 'yyyy-MM-dd')}`;
          reportTitle = 'Sales Report';
          break;
        case 'products':
          exportData = formatDataForExport(getTopSellingProducts(), 'products', formatCurrency);
          fileName = `top_products_report_${format(new Date(), 'yyyy-MM-dd')}`;
          reportTitle = 'Top Products Report';
          break;
        case 'inventory':
          exportData = formatDataForExport(products, 'inventory', formatCurrency);
          fileName = `inventory_report_${format(new Date(), 'yyyy-MM-dd')}`;
          reportTitle = 'Inventory Report';
          break;
      }
      
      // Export based on selected format
      switch (format) {
        case 'excel':
          exportToExcel(exportData, fileName, currentShop.name);
          break;
        case 'pdf':
          exportToPDF(exportData, fileName, currentShop.name, reportTitle);
          break;
        case 'word':
          exportToWord(exportData, fileName, currentShop.name, reportTitle);
          break;
      }
      
      toast({
        title: "Export Successful",
        description: `Report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was a problem exporting your report.",
        variant: "destructive",
      });
    }
  };
  
  const revenueData = getDailyRevenueData();
  const topProducts = getTopSellingProducts();
  const stats = calculateStats();
  
  // If no shop is selected, show a message
  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You need to add a shop before you can view reports.
        </p>
        <Button onClick={() => navigate('/shops/add')}>
          Add Your First Shop
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your business
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Printer className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer flex items-center gap-2">
                <FileText className="h-4 w-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('word')} className="cursor-pointer flex items-center gap-2">
                <File className="h-4 w-4" /> Word
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Revenue</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.totalSales} sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Today's Revenue</p>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todayTransactions} transactions today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Products</p>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {products.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {products.filter(p => p.stockQuantity < 10).length} low stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Items Sold</p>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {stats.totalItems}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all transactions
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main tabs */}
      <Tabs defaultValue="sales" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sales Overview</h2>
            <div className="flex gap-2 items-center">
              <div className="flex gap-2">
                <Button 
                  variant={timeRange === 'week' ? 'default' : 'outline'} 
                  onClick={() => setTimeRange('week')}
                  size="sm"
                >
                  Week
                </Button>
                <Button 
                  variant={timeRange === 'month' ? 'default' : 'outline'} 
                  onClick={() => setTimeRange('month')}
                  size="sm"
                >
                  Month
                </Button>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button onClick={() => handleExport('excel')} variant="outline" size="sm" className="flex gap-1">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" className="flex gap-1">
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                <Button onClick={() => handleExport('word')} variant="outline" size="sm" className="flex gap-1">
                  <File className="h-4 w-4" />
                  Word
                </Button>
              </div>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6 pb-2">
              <div className="h-[300px]">
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="displayDate" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value).replace(/[^0-9]/g, '')} 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), 'Revenue']} 
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#8884d8"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No sales data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Top Selling Products</h2>
            <div className="flex gap-2">
              <Button onClick={() => handleExport('excel')} variant="outline" size="sm" className="flex gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" className="flex gap-1">
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button onClick={() => handleExport('word')} variant="outline" size="sm" className="flex gap-1">
                <File className="h-4 w-4" />
                Word
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6 pb-2">
              <div className="h-[300px]">
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProducts}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantity" name="Quantity Sold" fill="#82ca9d" />
                      <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No sales data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Inventory Status</h2>
            <div className="flex gap-2">
              <Button onClick={() => handleExport('excel')} variant="outline" size="sm" className="flex gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" className="flex gap-1">
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button onClick={() => handleExport('word')} variant="outline" size="sm" className="flex gap-1">
                <File className="h-4 w-4" />
                Word
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6 pb-2">
              <div className="h-[300px]">
                {products.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={products.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={150} 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="stockQuantity" name="Stock Quantity" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No product data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
