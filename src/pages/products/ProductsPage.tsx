import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowUpDown, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

const PAGE_SIZE = 25;

// Only the columns the table actually renders — avoids over-fetching.
const PRODUCT_COLUMNS =
  'id, name, category, barcode, buying_price, selling_price, stock_quantity, min_stock_level, unit';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const shopId = currentShop?.id;

  // Debounce search so typing doesn't fire a request per keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Reset to first page whenever the query shape changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, sortColumn, sortDirection, shopId]);

  const { data, isFetching } = useQuery({
    queryKey: ['products', shopId, page, debouncedSearch, sortColumn, sortDirection],
    enabled: !!shopId,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      let query = supabase
        .from('products')
        .select(PRODUCT_COLUMNS, { count: 'exact' })
        .eq('shop_id', shopId!)
        .eq('is_active', true)
        .order(sortColumn as string, { ascending: sortDirection === 'asc' })
        .range(from, from + PAGE_SIZE - 1);

      if (debouncedSearch) {
        const term = `%${debouncedSearch}%`;
        query = query.or(`name.ilike.${term},category.ilike.${term},barcode.ilike.${term}`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data || []) as unknown as Product[], count: count ?? 0 };
    },
  });

  const products = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleDelete = async (productId: string, productName: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to load products');
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['products', shopId] });
    toast.success(`"${productName}" deleted successfully`);
  };

  const currency = currentShop?.currency || 'KES';
  const formatter = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }),
    [currency]
  );
  const formatCurrency = (amount: number) => formatter.format(Number(amount) || 0);

  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

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
            {isFetching && products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found</TableCell>
              </TableRow>
            ) : (
              products.map(product => (
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

      {total > 0 && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
              <ChevronLeft size={16} /> <span className="hidden sm:inline">Prev</span>
            </Button>
            <span className="text-muted-foreground">{page + 1} / {pageCount}</span>
            <Button variant="outline" size="sm" disabled={page + 1 >= pageCount} onClick={() => setPage(p => p + 1)}>
              <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
