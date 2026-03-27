
import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Package as PackageIcon, Plus, Search, CreditCard, Tag, Undo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product, CartItem } from '@/types';
import { ProductSearch } from './components/ProductSearch';
import { CartDisplay } from './components/CartDisplay';
import { CheckoutDialog } from './components/CheckoutDialog';
import { supabase } from '@/integrations/supabase/client';

const POSPage: React.FC = () => {
  const { currentShop } = useShop();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const currencyCode = currentShop?.currency || 'KES';

  useEffect(() => {
    if (currentShop) loadProducts();
  }, [currentShop]);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const loadProducts = async () => {
    if (!currentShop) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', currentShop.id)
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setProducts(data as Product[]);
      setFilteredProducts(data as Product[]);
    }
    setLoading(false);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      toast({ variant: "destructive", title: "Product not found", description: `No product with barcode ${barcodeInput}` });
    }
  };

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
          toast({ variant: "destructive", title: "Stock limit reached", description: `Only ${product.stock_quantity} available.` });
          return prevItems;
        }
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.selling_price }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1, subtotal: product.selling_price }];
    });
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) { removeFromCart(productId); return; }
    const cartItem = cartItems.find(item => item.product.id === productId);
    if (!cartItem) return;
    if (newQuantity > cartItem.product.stock_quantity) {
      toast({ variant: "destructive", title: "Stock limit reached", description: `Only ${cartItem.product.stock_quantity} available.` });
      return;
    }
    setCartItems(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.selling_price }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCartItems([]);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({ variant: "destructive", title: "Empty cart", description: "Please add items to cart." });
      return;
    }
    setIsCheckoutDialogOpen(true);
  };

  const processPayment = async (paymentMethod: string, amountPaid: number) => {
    if (!currentShop || !user) return;

    try {
      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          shop_id: currentShop.id,
          user_id: user.id,
          subtotal: cartTotal,
          discount: 0,
          tax: 0,
          total: cartTotal,
          payment_method: paymentMethod,
          payment_status: 'paid',
          receipt_number: `REC-${Date.now()}`,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items (triggers update stock automatically)
      const saleItems = cartItems.map(item => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        discount: 0,
        total: item.subtotal,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      toast({
        title: "Sale completed!",
        description: `${cartItems.length} items sold for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(cartTotal)}`,
      });

      clearCart();
      setIsCheckoutDialogOpen(false);
      loadProducts(); // Refresh stock
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground">Select a shop to use POS.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      <div className="w-full lg:w-2/3 h-full flex flex-col">
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <ProductSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <form onSubmit={handleBarcodeSubmit} className="flex w-full max-w-sm items-center space-x-2">
              <Input type="text" placeholder="Scan barcode..." value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} className="flex-1" />
              <Button type="submit" size="sm">Scan</Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4">
          {loading ? (
            <div className="col-span-full text-center text-muted-foreground py-8">Loading products...</div>
          ) : filteredProducts.map(product => (
            <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="p-3"><CardTitle className="text-sm">{product.name}</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</div>
                  <PackageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-1 font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 0 }).format(product.selling_price)}
                </div>
              </CardContent>
              <CardFooter className="p-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => addToCart(product)} disabled={product.stock_quantity === 0}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-1/3 bg-muted/30 rounded-lg p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5" /> Cart
            <span className="ml-2 text-sm bg-primary text-primary-foreground rounded-full px-2 py-0.5">{cartItemCount}</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={clearCart} disabled={cartItems.length === 0} className="text-muted-foreground hover:text-destructive">
            <Undo className="mr-1 h-4 w-4" /> Clear
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mb-2 opacity-20" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add products to begin</p>
            </div>
          ) : (
            <CartDisplay cartItems={cartItems} updateCartItemQuantity={updateCartItemQuantity} removeFromCart={removeFromCart} currencyCode={currencyCode} />
          )}
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 0 }).format(cartTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mb-6">
            <span>Total</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 0 }).format(cartTotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full" disabled={cartItems.length === 0}>
              <Tag className="mr-2 h-4 w-4" /> Apply Discount
            </Button>
            <Button className="w-full" onClick={handleCheckout} disabled={cartItems.length === 0}>
              <CreditCard className="mr-2 h-4 w-4" /> Checkout
            </Button>
          </div>
        </div>
      </div>

      <CheckoutDialog
        isOpen={isCheckoutDialogOpen}
        setIsOpen={setIsCheckoutDialogOpen}
        cartItems={cartItems}
        cartTotal={cartTotal}
        currencyCode={currencyCode}
        handleCheckout={processPayment}
      />
    </div>
  );
};

export default POSPage;
