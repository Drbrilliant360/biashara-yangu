
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowUpDown, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useShop } from '@/context/ShopContext';
import { Product } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageHead } from '@/components/seo/PageHead';

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

    if (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
    if (data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  const handleDelete = async (productId: string, productName: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
      return;
    }

    setProducts(prev => prev.filter(p => p.id !== productId));
    toast.success(`"${productName}" deleted successfully`);
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
      <PageHead title="Products" description="Manage your product catalog: track stock levels, prices, categories and barcodes across your shops." path="/products" />
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold truncate">{t('products')}</h1>
        <Button onClick={() => navigate('/products/add')} className="shrink-0">
          <Plus size={18} className="sm:mr-1" />
          <span className="hidden sm:inline">{t('addProduct')}</span>
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                Name <ArrowUpDown size={14} className="inline ml-1" />
              </TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Barcode</TableHead>
              <TableHead className="hidden sm:table-cell cursor-pointer text-right" onClick={() => handleSort('buying_price')}>
                Cost <ArrowUpDown size={14} className="inline ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('selling_price')}>
                Price <ArrowUpDown size={14} className="inline ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('stock_quantity')}>
                Stock <ArrowUpDown size={14} className="inline ml-1" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found</TableCell>
              </TableRow>
            ) : (
              sortedProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="min-w-0">
                      <div className="truncate max-w-[160px] sm:max-w-none">{product.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden truncate">
                        {product.category || '—'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.category || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{product.barcode || '-'}</TableCell>
                  <TableCell className="hidden sm:table-cell text-right">{formatCurrency(product.buying_price)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(product.selling_price)}</TableCell>
                  <TableCell className={`text-right ${product.stock_quantity <= product.min_stock_level ? 'text-destructive font-bold' : ''}`}>
                    {product.stock_quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" aria-label="Edit product" onClick={() => navigate(`/products/edit/${product.id}`)}>
                        <Edit size={16} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Delete product" className="text-destructive hover:text-destructive">
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{product.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this product.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product.id, product.name)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
