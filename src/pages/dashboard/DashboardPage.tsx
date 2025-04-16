
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  ArrowRight, 
  TrendingUp,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useShop } from '@/context/ShopContext';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import { Product, Sale } from '@/types';

const DashboardPage: React.FC = () => {
  const { currentShop } = useShop();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    if (currentShop) {
      // Load data from storage
      const allProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, [])
        .filter(p => p.shopId === currentShop.id);
      
      const allSales = getItem<Sale[]>(STORAGE_KEYS.SALES, [])
        .filter(s => s.shopId === currentShop.id);
      
      setProducts(allProducts);
      setSales(allSales);
      
      // Get recent sales (last 5)
      setRecentSales(
        [...allSales]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
      );
      
      // Get low stock products (less than 10 items)
      setLowStockProducts(
        allProducts
          .filter(p => p.stockQuantity < 10 && p.isActive)
          .sort((a, b) => a.stockQuantity - b.stockQuantity)
          .slice(0, 5)
      );
    }
  }, [currentShop]);
  
  // Calculate sales statistics
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp).toDateString();
    const today = new Date().toDateString();
    return saleDate === today;
  });
  
  const todayRevenue = todaySales.reduce((total, sale) => total + sale.total, 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // If no shop is selected, show a message
  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You need to add a shop before you can view the dashboard.
        </p>
        <Button onClick={() => navigate('/shops/add')}>
          Add Your First Shop
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">
          <Calendar className="inline mr-2" size={14} />
          Today: {new Date().toLocaleDateString()}
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stats-card border-l-4 border-l-biashara-primary">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Today's Sales</h3>
            <DollarSign size={18} className="text-biashara-primary" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {todaySales.length} transactions
          </div>
        </Card>
        
        <Card className="stats-card border-l-4 border-l-biashara-accent">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Products</h3>
            <Package size={18} className="text-biashara-accent" />
          </div>
          <div className="text-2xl font-bold">{products.length}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {lowStockProducts.length} low stock
          </div>
        </Card>
        
        <Card className="stats-card border-l-4 border-l-biashara-secondary">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Sales</h3>
            <TrendingUp size={18} className="text-biashara-secondary" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(sales.reduce((total, sale) => total + sale.total, 0))}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {sales.length} transactions
          </div>
        </Card>
        
        <Card className="stats-card border-l-4 border-l-biashara-success">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Quick Access</h3>
            <ShoppingCart size={18} className="text-biashara-success" />
          </div>
          <Button 
            size="sm" 
            className="w-full mt-1 bg-biashara-success hover:bg-biashara-success/80"
            onClick={() => navigate('/pos')}
          >
            Open POS
          </Button>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Recent Sales</h2>
            <Button 
              variant="ghost" 
              className="h-8 text-sm gap-1"
              onClick={() => navigate('/sales')}
            >
              View all
              <ArrowRight size={14} />
            </Button>
          </div>
          
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div 
                  key={sale.id}
                  className="bg-muted/50 p-3 rounded-md flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{formatCurrency(sale.total)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sale.timestamp).toLocaleTimeString()} • Receipt #{sale.receiptNumber}
                    </div>
                  </div>
                  <div className="text-sm">{sale.items.length} items</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No sales recorded yet</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => navigate('/pos')}
              >
                Make your first sale
              </Button>
            </div>
          )}
        </Card>
        
        {/* Low Stock Products */}
        <Card className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Low Stock Products</h2>
            <Button 
              variant="ghost" 
              className="h-8 text-sm gap-1"
              onClick={() => navigate('/products')}
            >
              View all
              <ArrowRight size={14} />
            </Button>
          </div>
          
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-muted/50 p-3 rounded-md flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.barcode || 'No barcode'} • {formatCurrency(product.price)}
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    product.stockQuantity <= 5 ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {product.stockQuantity} in stock
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No low stock products</p>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No products added yet</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => navigate('/products/add')}
              >
                Add your first product
              </Button>
            </div>
          )}
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-24 flex-col border-dashed hover:border-biashara-primary hover:bg-biashara-primary/5"
          onClick={() => navigate('/products/add')}
        >
          <Package className="h-8 w-8 mb-2" />
          <span>Add Products</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-24 flex-col border-dashed hover:border-biashara-primary hover:bg-biashara-primary/5"
          onClick={() => navigate('/customers')}
        >
          <Users className="h-8 w-8 mb-2" />
          <span>Manage Customers</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-24 flex-col border-dashed hover:border-biashara-primary hover:bg-biashara-primary/5"
          onClick={() => navigate('/reports')}
        >
          <ArrowUpRight className="h-8 w-8 mb-2" />
          <span>View Reports</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;
