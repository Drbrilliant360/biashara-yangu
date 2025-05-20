
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  FileText2,
  Table as TableIcon,
  Calendar,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Product } from '@/types';
import { formatDataForExport, exportToExcel, exportToPDF, exportToWord } from '@/utils/exportUtils';
import QuotationTab from './components/QuotationTab';

// Mock data for demonstration purposes
// In a real app, this would come from an API or context

// Mock sales data
const mockSalesData = [
  { date: '2023-05-01', sales: 12500, transactions: 45 },
  { date: '2023-05-02', sales: 14200, transactions: 52 },
  { date: '2023-05-03', sales: 15800, transactions: 61 },
  { date: '2023-05-04', sales: 16900, transactions: 67 },
  { date: '2023-05-05', sales: 17500, transactions: 72 },
  { date: '2023-05-06', sales: 18100, transactions: 76 },
  { date: '2023-05-07', sales: 16400, transactions: 68 },
];

// Mock products data
const mockProducts: Product[] = [
  { id: '1', name: 'T-Shirt', price: 1500, stockQuantity: 25, category: 'Clothing', shopId: '1', isActive: true },
  { id: '2', name: 'Jeans', price: 3500, stockQuantity: 15, category: 'Clothing', shopId: '1', isActive: true },
  { id: '3', name: 'Coffee Mug', price: 800, stockQuantity: 30, category: 'Household', shopId: '1', isActive: true },
  { id: '4', name: 'Notebook', price: 250, stockQuantity: 50, category: 'Stationery', shopId: '1', isActive: true },
  { id: '5', name: 'Water Bottle', price: 600, stockQuantity: 40, category: 'Household', shopId: '1', isActive: true },
  { id: '6', name: 'Headphones', price: 4500, stockQuantity: 10, category: 'Electronics', shopId: '1', isActive: true },
  { id: '7', name: 'Backpack', price: 3200, stockQuantity: 12, category: 'Accessories', shopId: '1', isActive: true },
];

// Mock product sales data
const mockProductSales = [
  { productId: '1', name: 'T-Shirt', quantity: 120, revenue: 180000 },
  { productId: '2', name: 'Jeans', quantity: 85, revenue: 297500 },
  { productId: '3', name: 'Coffee Mug', quantity: 200, revenue: 160000 },
  { productId: '4', name: 'Notebook', quantity: 350, revenue: 87500 },
  { productId: '5', name: 'Water Bottle', quantity: 175, revenue: 105000 },
  { productId: '6', name: 'Headphones', quantity: 60, revenue: 270000 },
  { productId: '7', name: 'Backpack', quantity: 45, revenue: 144000 },
];

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

const ReportsPage: React.FC = () => {
  const { currentShop } = useShop();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('sales');
  
  // State for date range
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  
  // State for timeframe select
  const [timeFrame, setTimeFrame] = useState('week');
  
  // Products state
  const [products] = useState<Product[]>(mockProducts);
  
  useEffect(() => {
    // In a real app, we would fetch data based on the date range
    console.log('Fetching data for date range:', dateRange);
  }, [dateRange]);
  
  // Format currency based on shop settings
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Prepare data for daily revenue chart
  const getDailyRevenueData = () => {
    return mockSalesData.map(day => ({
      displayDate: new Date(day.date).toLocaleDateString(),
      date: day.date,
      revenue: day.sales,
      transactions: day.transactions
    }));
  };
  
  // Get top selling products
  const getTopSellingProducts = () => {
    return [...mockProductSales]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };
  
  // Calculate total revenue
  const getTotalRevenue = () => {
    return mockSalesData.reduce((total, day) => total + day.sales, 0);
  };
  
  // Calculate total transactions
  const getTotalTransactions = () => {
    return mockSalesData.reduce((total, day) => total + day.transactions, 0);
  };
  
  // Calculate average transaction value
  const getAverageTransactionValue = () => {
    const totalRevenue = getTotalRevenue();
    const totalTransactions = getTotalTransactions();
    return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    
    // In a real app, this would trigger data refetch
    toast({
      title: "Date range updated",
      description: range 
        ? `From ${range.from?.toLocaleDateString()} to ${range.to?.toLocaleDateString()}` 
        : "No date range selected",
    });
  };
  
  // Handle timeframe change
  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value);
    
    let newDateRange: DateRange | undefined;
    const today = new Date();
    
    switch(value) {
      case 'today':
        newDateRange = {
          from: today,
          to: today
        };
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        newDateRange = {
          from: yesterday,
          to: yesterday
        };
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        newDateRange = {
          from: weekAgo,
          to: today
        };
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        newDateRange = {
          from: monthAgo,
          to: today
        };
        break;
    }
    
    setDateRange(newDateRange);
  };
  
  // Export report data
  const handleExport = (format: 'excel' | 'pdf' | 'word', reportType: string) => {
    // Prepare data and file name based on active tab
    let exportData: any[] = [];
    let fileName: string;
    let reportTitle: string;
    
    switch (activeTab) {
      case 'sales':
        exportData = formatDataForExport(getDailyRevenueData(), 'sales', formatCurrency);
        fileName = `sales_report_${new Date().toISOString().split('T')[0]}`;
        reportTitle = 'Sales Report';
        break;
      case 'products':
        exportData = formatDataForExport(getTopSellingProducts(), 'products', formatCurrency);
        fileName = `top_products_report_${new Date().toISOString().split('T')[0]}`;
        reportTitle = 'Top Products Report';
        break;
      case 'inventory':
        exportData = formatDataForExport(products, 'inventory', formatCurrency);
        fileName = `inventory_report_${new Date().toISOString().split('T')[0]}`;
        reportTitle = 'Inventory Report';
        break;
      case 'quotations':
        // This will use the mockQuotationItems data from QuotationTab component
        // We'll get it from there using the formatDataForExport function
        fileName = `quotation_report_${new Date().toISOString().split('T')[0]}`;
        reportTitle = 'Quotation Report';
        break;
    }
    
    if (exportData.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no data available to export.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Export based on format
      switch (format) {
        case 'excel':
          exportToExcel(exportData, fileName, currentShop?.name || 'Business');
          break;
        case 'pdf':
          exportToPDF(exportData, fileName, currentShop?.name || 'Business', reportTitle);
          break;
        case 'word':
          exportToWord(exportData, fileName, currentShop?.name || 'Business', reportTitle);
          break;
      }
      
      toast({
        title: "Export successful",
        description: `Your ${reportTitle} has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View and analyze your business data
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            align="end"
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="quotations">Quotations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sales" className="space-y-4">
              {/* Sales summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(getTotalRevenue())}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {getTotalTransactions()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Transaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(getAverageTransactionValue())}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Sales chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue</CardTitle>
                  <CardDescription>
                    Revenue and transactions for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getDailyRevenueData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="displayDate" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Bar 
                          dataKey="revenue" 
                          name="Revenue" 
                          fill="#0088FE"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExport('excel', 'sales')}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Export to Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExport('pdf', 'sales')}
                  >
                    <FileText2 className="mr-2 h-4 w-4" /> Export to PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExport('word', 'sales')}
                  >
                    <TableIcon className="mr-2 h-4 w-4" /> Export to Word
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="products" className="space-y-4">
              {/* Products charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>
                      By revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getTopSellingProducts()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="revenue"
                            nameKey="name"
                          >
                            {getTopSellingProducts().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => formatCurrency(value)}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products Table</CardTitle>
                    <CardDescription>
                      Top selling products by quantity and revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity Sold</TableHead>
                          <TableHead>Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getTopSellingProducts().map((product) => (
                          <TableRow key={product.productId}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{formatCurrency(product.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExport('excel', 'products')}
                    >
                      <FileText className="mr-2 h-4 w-4" /> Export to Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExport('pdf', 'products')}
                    >
                      <FileText2 className="mr-2 h-4 w-4" /> Export to PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExport('word', 'products')}
                    >
                      <TableIcon className="mr-2 h-4 w-4" /> Export to Word
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Status</CardTitle>
                  <CardDescription>
                    Current stock levels for all products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.category || 'Uncategorized'}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.stockQuantity}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.stockQuantity > 20 
                                ? 'bg-green-100 text-green-800'
                                : product.stockQuantity > 5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.stockQuantity > 20 
                                ? 'In Stock' 
                                : product.stockQuantity > 5
                                ? 'Low Stock'
                                : 'Critical'
                              }
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExport('excel', 'inventory')}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Export to Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExport('pdf', 'inventory')}
                  >
                    <FileText2 className="mr-2 h-4 w-4" /> Export to PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExport('word', 'inventory')}
                  >
                    <TableIcon className="mr-2 h-4 w-4" /> Export to Word
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="quotations">
              <QuotationTab handleExport={handleExport} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
