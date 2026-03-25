
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { useShop } from '@/context/ShopContext';

interface CreateQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuotationCreated: () => void;
}

interface QuotationFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  quotation_number: string;
  valid_until: string;
  notes: string;
}

interface QuotationItemFormData {
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

const CreateQuotationDialog: React.FC<CreateQuotationDialogProps> = ({ open, onOpenChange, onQuotationCreated }) => {
  const { toast } = useToast();
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const createQuotationNumber = () => `QT-${Date.now().toString().slice(-8)}`;
  
  const [quotationData, setQuotationData] = useState<QuotationFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    quotation_number: createQuotationNumber(),
    valid_until: '',
    notes: '',
  });

  const [items, setItems] = useState<QuotationItemFormData[]>([
    {
      product_name: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
    },
  ]);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    }
  };

  const addItem = () => {
    setItems([...items, {
      product_name: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuotationItemFormData, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setItems((prevItems) => prevItems.map((item, itemIndex) => (
        itemIndex === index
          ? {
              ...item,
              product_id: productId,
              product_name: product.name,
              unit_price: product.selling_price,
            }
          : item
      )));
    }
  };

  const calculateItemTotals = (item: QuotationItemFormData) => {
    const subtotal = item.quantity * item.unit_price;
    const total = Math.max(subtotal - item.discount, 0);
    return { subtotal, total };
  };

  const calculateQuotationTotals = () => {
    let subtotal = 0;
    let discount = 0;
    let total = 0;

    items.forEach(item => {
      const { subtotal: itemSubtotal, total: itemTotal } = calculateItemTotals(item);
      subtotal += itemSubtotal;
      discount += item.discount;
      total += itemTotal;
    });

    return { subtotal, discount, tax: 0, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (!currentShop) throw new Error('No shop selected');

      const totals = calculateQuotationTotals();

      // Create quotation
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          user_id: user.id,
          shop_id: currentShop.id,
          customer_name: quotationData.customer_name,
          customer_phone: quotationData.customer_phone || null,
          customer_email: quotationData.customer_email || null,
          quotation_number: quotationData.quotation_number,
          valid_until: quotationData.valid_until || null,
          notes: quotationData.notes || null,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          total: totals.total,
          status: 'pending',
        })
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Create quotation items
      const quotationItems = items.map(item => {
        const { total } = calculateItemTotals(item);
        return {
          quotation_id: quotation.id,
          product_id: item.product_id || null,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total,
        };
      });

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(quotationItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Quotation created successfully",
      });

      onQuotationCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuotationData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      quotation_number: createQuotationNumber(),
      valid_until: '',
      notes: '',
    });
    setItems([{
      product_name: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
    }]);
  };

  const totals = calculateQuotationTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle>Create New Quotation</DialogTitle>
          <DialogDescription>
              Add customer details and products to create a quotation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={quotationData.customer_name}
                  onChange={(e) => setQuotationData({ ...quotationData, customer_name: e.target.value })}
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Customer Phone</Label>
                <Input
                  id="customer_phone"
                  value={quotationData.customer_phone}
                  onChange={(e) => setQuotationData({ ...quotationData, customer_phone: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Customer Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={quotationData.customer_email}
                  onChange={(e) => setQuotationData({ ...quotationData, customer_email: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="quotation_number">Quotation Number *</Label>
                <Input
                  id="quotation_number"
                  value={quotationData.quotation_number}
                  onChange={(e) => setQuotationData({ ...quotationData, quotation_number: e.target.value })}
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={quotationData.valid_until}
                  onChange={(e) => setQuotationData({ ...quotationData, valid_until: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={quotationData.notes}
                  onChange={(e) => setQuotationData({ ...quotationData, notes: e.target.value })}
                  placeholder="Optional notes for the quotation"
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quotation Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Quotation Items</CardTitle>
              <Button type="button" onClick={addItem} size="sm" className="text-xs">
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                        <TableHead className="min-w-[220px] text-xs p-2">Product</TableHead>
                      <TableHead className="w-16 text-xs p-2">Qty</TableHead>
                        <TableHead className="w-24 text-xs p-2">Unit Price</TableHead>
                        <TableHead className="w-24 text-xs p-2">Discount</TableHead>
                        <TableHead className="w-24 text-xs p-2">Total</TableHead>
                      <TableHead className="w-10 text-xs p-2">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const { total } = calculateItemTotals(item);
                      return (
                        <TableRow key={index}>
                          <TableCell className="p-2">
                            <div className="space-y-1">
                              <Select value={item.product_id} onValueChange={(value) => selectProduct(index, value)}>
                                <SelectTrigger className="text-xs h-8">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id} className="text-xs">
                                      {product.name} - ${product.selling_price}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Product name"
                                value={item.product_name}
                                onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                                className="text-xs h-8"
                                required
                              />
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="text-xs h-8"
                              required
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="text-xs h-8"
                              required
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              className="text-xs h-8"
                            />
                          </TableCell>
                          <TableCell className="text-xs font-medium p-2">
                            ${total.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                              className="h-6 w-6"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Totals Summary */}
              <div className="mt-4 border-t pt-4 px-4 pb-4">
                <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-8 text-sm">
                  <div>Subtotal: <span className="font-medium">${totals.subtotal.toFixed(2)}</span></div>
                  <div>Discount: <span className="font-medium">${totals.discount.toFixed(2)}</span></div>
                  <div className="text-lg font-bold">Total: <span>${totals.total.toFixed(2)}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Quotation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuotationDialog;
