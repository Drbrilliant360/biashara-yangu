
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
import { Quotation, QuotationItem, Product } from '@/types';

interface CreateQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuotationCreated: () => void;
}

interface QuotationFormData {
  client_name: string;
  client_location: string;
  reference_number: string;
  quotation_date: string;
}

interface QuotationItemFormData {
  product_id?: string;
  part_number: string;
  description: string;
  brand: string;
  quantity: number;
  rate: number;
  vat_percentage: number;
}

const CreateQuotationDialog: React.FC<CreateQuotationDialogProps> = ({ open, onOpenChange, onQuotationCreated }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [quotationData, setQuotationData] = useState<QuotationFormData>({
    client_name: '',
    client_location: '',
    reference_number: '',
    quotation_date: new Date().toISOString().split('T')[0]
  });

  const [items, setItems] = useState<QuotationItemFormData[]>([
    {
      part_number: '',
      description: '',
      brand: '',
      quantity: 1,
      rate: 0,
      vat_percentage: 0
    }
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
      part_number: '',
      description: '',
      brand: '',
      quantity: 1,
      rate: 0,
      vat_percentage: 0
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
      updateItem(index, 'product_id', productId);
      updateItem(index, 'part_number', product.barcode || product.name);
      updateItem(index, 'description', product.description || product.name);
      updateItem(index, 'rate', product.price);
    }
  };

  const calculateItemTotals = (item: QuotationItemFormData) => {
    const amount = item.quantity * item.rate;
    const vat_amount = (amount * item.vat_percentage) / 100;
    const total_amount = amount + vat_amount;
    return { amount, vat_amount, total_amount };
  };

  const calculateQuotationTotals = () => {
    let total_amount = 0;
    let vat_amount = 0;
    let grand_total = 0;

    items.forEach(item => {
      const { amount, vat_amount: itemVat, total_amount: itemTotal } = calculateItemTotals(item);
      total_amount += amount;
      vat_amount += itemVat;
      grand_total += itemTotal;
    });

    return { total_amount, vat_amount, grand_total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const totals = calculateQuotationTotals();

      // Create quotation
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          user_id: user.id,
          ...quotationData,
          ...totals
        })
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Create quotation items
      const quotationItems = items.map(item => {
        const { amount, vat_amount, total_amount } = calculateItemTotals(item);
        return {
          quotation_id: quotation.id,
          part_number: item.part_number,
          description: item.description,
          brand: item.brand,
          quantity: item.quantity,
          rate: item.rate,
          amount,
          vat_percentage: item.vat_percentage,
          vat_amount,
          total_amount
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
      client_name: '',
      client_location: '',
      reference_number: '',
      quotation_date: new Date().toISOString().split('T')[0]
    });
    setItems([{
      part_number: '',
      description: '',
      brand: '',
      quantity: 1,
      rate: 0,
      vat_percentage: 0
    }]);
  };

  const totals = calculateQuotationTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quotation</DialogTitle>
          <DialogDescription>
            Add client details and products to create a quotation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={quotationData.client_name}
                  onChange={(e) => setQuotationData({ ...quotationData, client_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="client_location">Client Location</Label>
                <Input
                  id="client_location"
                  value={quotationData.client_location}
                  onChange={(e) => setQuotationData({ ...quotationData, client_location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={quotationData.reference_number}
                  onChange={(e) => setQuotationData({ ...quotationData, reference_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="quotation_date">Quotation Date *</Label>
                <Input
                  id="quotation_date"
                  type="date"
                  value={quotationData.quotation_date}
                  onChange={(e) => setQuotationData({ ...quotationData, quotation_date: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Quotation Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Quotation Items</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Product/Part Number</TableHead>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="min-w-[120px]">Brand</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-24">Rate</TableHead>
                      <TableHead className="w-20">VAT %</TableHead>
                      <TableHead className="w-24">Amount</TableHead>
                      <TableHead className="w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const { amount, vat_amount, total_amount } = calculateItemTotals(item);
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="space-y-2">
                              <Select onValueChange={(value) => selectProduct(index, value)}>
                                <SelectTrigger className="text-xs">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} - {product.price}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Part Number"
                                value={item.part_number}
                                onChange={(e) => updateItem(index, 'part_number', e.target.value)}
                                className="text-xs"
                                required
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Brand"
                              value={item.brand}
                              onChange={(e) => updateItem(index, 'brand', e.target.value)}
                              className="text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="text-xs"
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.rate}
                              onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="text-xs"
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={item.vat_percentage}
                              onChange={(e) => updateItem(index, 'vat_percentage', parseFloat(e.target.value) || 0)}
                              className="text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {total_amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Totals Summary */}
              <div className="mt-4 border-t pt-4">
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-8 text-sm">
                  <div>Total Amount: <span className="font-medium">{totals.total_amount.toFixed(2)}</span></div>
                  <div>VAT Amount: <span className="font-medium">{totals.vat_amount.toFixed(2)}</span></div>
                  <div className="text-lg font-bold">Grand Total: <span>{totals.grand_total.toFixed(2)}</span></div>
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
