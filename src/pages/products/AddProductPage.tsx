
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { useShop } from '@/context/ShopContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  sellingPrice: z.string().min(1, "Selling price is required"),
  buyingPrice: z.string().optional(),
  stockQuantity: z.string().min(1, "Stock quantity is required"),
  minStockLevel: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
});

type FormValues = z.infer<typeof productSchema>;

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', barcode: '', sku: '', description: '',
      sellingPrice: '', buyingPrice: '', stockQuantity: '1',
      minStockLevel: '5', category: '', unit: 'piece',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!currentShop) {
      toast.error("No shop selected.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('products').insert({
        shop_id: currentShop.id,
        name: data.name,
        barcode: data.barcode || null,
        sku: data.sku || null,
        description: data.description || null,
        selling_price: parseFloat(data.sellingPrice),
        buying_price: data.buyingPrice ? parseFloat(data.buyingPrice) : 0,
        stock_quantity: parseInt(data.stockQuantity, 10),
        min_stock_level: data.minStockLevel ? parseInt(data.minStockLevel, 10) : 5,
        category: data.category || null,
        unit: data.unit || 'piece',
      });

      if (error) throw error;

      toast.success("Product added successfully!");
      navigate('/products');
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || "Failed to add product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">You need to add a shop before you can add products.</p>
        <Button onClick={() => navigate('/shops/add')}>Add Your First Shop</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Button variant="ghost" onClick={() => navigate('/products')} className="mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back to Products
      </Button>

      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Product Name *</FormLabel><FormControl><Input {...field} placeholder="Enter product name" /></FormControl><FormMessage /></FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="barcode" render={({ field }) => (
              <FormItem><FormLabel>Barcode</FormLabel><FormControl><Input {...field} placeholder="Barcode" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="sku" render={({ field }) => (
              <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} placeholder="SKU" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sellingPrice" render={({ field }) => (
              <FormItem><FormLabel>Selling Price ({currentShop.currency}) *</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="buyingPrice" render={({ field }) => (
              <FormItem><FormLabel>Buying Price ({currentShop.currency})</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="stockQuantity" render={({ field }) => (
              <FormItem><FormLabel>Stock Quantity *</FormLabel><FormControl><Input type="number" {...field} placeholder="0" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="minStockLevel" render={({ field }) => (
              <FormItem><FormLabel>Min Stock Level</FormLabel><FormControl><Input type="number" {...field} placeholder="5" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} placeholder="e.g. Electronics" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="unit" render={({ field }) => (
              <FormItem><FormLabel>Unit</FormLabel><FormControl><Input {...field} placeholder="e.g. piece, kg" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Product description" /></FormControl><FormMessage /></FormItem>
          )} />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/products')}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save size={16} className="mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddProductPage;
