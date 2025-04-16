
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useShop } from '@/context/ShopContext';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import { Product } from '@/types';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    if (currentShop) {
      // Load products for the current shop
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
  
  // Handle sorting
  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Filter products by search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];
    
    if (valueA === undefined || valueB === undefined) return 0;
    
    // Handle numeric values
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Handle string values
    const strA = String(valueA).toLowerCase();
    const strB = String(valueB).toLowerCase();
    
    if (sortDirection === 'asc') {
      return strA.localeCompare(strB);
    } else {
      return strB.localeCompare(strA);
    }
  });
  
  // If no shop is selected, show a message
  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You need to add a shop before you can manage products.
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
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => navigate('/products/add')}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" className="flex gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>
      
      {/* Products table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Product Name
                  {sortColumn === 'name' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('category')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Category
                  {sortColumn === 'category' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('price')} className="cursor-pointer text-right">
                <div className="flex items-center justify-end gap-1">
                  Price
                  {sortColumn === 'price' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('stockQuantity')} className="cursor-pointer text-right">
                <div className="flex items-center justify-end gap-1">
                  Stock
                  {sortColumn === 'stockQuantity' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.length > 0 ? (
              sortedProducts.map((product) => (
                <TableRow 
                  key={product.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category || 'Uncategorized'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                  <TableCell className="text-right">{product.stockQuantity}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <p className="text-muted-foreground">No products found</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => navigate('/products/add')}
                  >
                    Add your first product
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductsPage;
