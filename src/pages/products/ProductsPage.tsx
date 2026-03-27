
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useShop } from '@/context/ShopContext';
import { Product } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentShop) {
      loadProducts();
    }
  }, [currentShop]);

  const loadProducts = async () => {
    if (!currentShop) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', currentShop.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const comparison = typeof aVal === 'string'
      ? aVal.localeCompare(bVal as string)
      : (aVal as number) - (bVal as number);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6">Select or create a shop first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('products')}</h1>
        <Button onClick={() => navigate('/products/add')}>
          <Plus size={18} className="mr-1" /> {t('addProduct')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Search size={18} className="text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                Name <ArrowUpDown size={14} className="inline ml-1" />
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('buying_price')}>
                Cost <ArrowUpDown size={14} className="inline ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('selling_price')}>
                Price <ArrowUpDown size={14} className="inline ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('stock_quantity')}>
                Stock <ArrowUpDown size={14} className="inline ml-1" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products found</TableCell>
              </TableRow>
            ) : (
              sortedProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category || '-'}</TableCell>
                  <TableCell>{product.barcode || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.buying_price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.selling_price)}</TableCell>
                  <TableCell className={`text-right ${product.stock_quantity <= product.min_stock_level ? 'text-destructive font-bold' : ''}`}>
                    {product.stock_quantity}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductsPage;
