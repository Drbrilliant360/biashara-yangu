
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useShop } from '@/context/ShopContext';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { Product } from '@/types';
import { toast } from 'sonner';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  barcode: z.string().optional(),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  costPrice: z.string().optional(),
  stockQuantity: z.string().min(1, "Stock quantity is required"),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof productSchema>;

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      barcode: '',
      description: '',
      price: '',
      costPrice: '',
      stockQuantity: '1',
      category: '',
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    if (!currentShop) {
      toast.error("No shop selected. Please select or create a shop first.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert string values to numbers
      const newProduct: Product = {
        id: crypto.randomUUID(),
        name: data.name,
        barcode: data.barcode || undefined,
        description: data.description || undefined,
        price: parseFloat(data.price),
        costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
        stockQuantity: parseInt(data.stockQuantity, 10),
        category: data.category || undefined,
        shopId: currentShop.id,
        isActive: true,
      };
      
      // Get existing products and add the new one
      const existingProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      existingProducts.push(newProduct);
      
      // Save updated products list
      setItem(STORAGE_KEYS.PRODUCTS, existingProducts);
      
      toast.success("Product added successfully!");
      navigate('/products');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If no shop is selected, show a message
  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You need to add a shop before you can add products.
        </p>
        <Button onClick={() => navigate('/shops/add')}>
          Add Your First Shop
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="Enter barcode number" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon">
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      placeholder="0.00"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Price</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      placeholder="0.00"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="1" 
                      placeholder="0"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Product category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter product description (optional)"
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Product
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddProductPage;
