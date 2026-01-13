import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Menubar, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import { ShoppingBag, Package as PackageIcon, Plus, Search, CreditCard, Tag, Undo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product, CartItem } from '@/types';
import { ProductSearch } from './components/ProductSearch';
import { CartDisplay } from './components/CartDisplay';
import { CheckoutDialog } from './components/CheckoutDialog';

// Mock products data - in a real app, this would come from context/API
const mockProducts: Product[] = [
  { id: '1', name: 'T-Shirt', selling_price: 1500, buying_price: 1000, stock_quantity: 25, barcode: '123456', category: 'Clothing', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' },
  { id: '2', name: 'Jeans', selling_price: 3500, buying_price: 2500, stock_quantity: 15, barcode: '234567', category: 'Clothing', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' },
  { id: '3', name: 'Coffee Mug', selling_price: 800, buying_price: 500, stock_quantity: 30, barcode: '345678', category: 'Household', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' },
  { id: '4', name: 'Notebook', selling_price: 250, buying_price: 150, stock_quantity: 50, barcode: '456789', category: 'Stationery', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' },
  { id: '5', name: 'Water Bottle', selling_price: 600, buying_price: 400, stock_quantity: 40, barcode: '567890', category: 'Household', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' },
  { id: '6', name: 'Headphones', selling_price: 4500, buying_price: 3000, stock_quantity: 10, barcode: '678901', category: 'Electronics', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' },
  { id: '7', name: 'Backpack', selling_price: 3200, buying_price: 2200, stock_quantity: 12, barcode: '789012', category: 'Accessories', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' },
  { id: '8', name: 'Phone Charger', selling_price: 1200, buying_price: 800, stock_quantity: 18, barcode: '890123', category: 'Electronics', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' },
  { id: '9', name: 'Hand Sanitizer', selling_price: 350, buying_price: 200, stock_quantity: 60, barcode: '901234', category: 'Health', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' },
  { id: '10', name: 'Face Mask Pack', selling_price: 450, buying_price: 300, stock_quantity: 75, barcode: '012345', category: 'Health', shop_id: '1', is_active: true, min_stock_level: 5, created_at: '', updated_at: '' }
];

const POSPage: React.FC = () => {
  const { currentShop } = useShop();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  
  // Calculate cart totals
  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const currencyCode = currentShop?.currency || 'KES';
  
  useEffect(() => {
    // Filter products based on search term
    const filtered = mockProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
    );
    setFilteredProducts(filtered);
  }, [searchTerm]);
  
  // Handle barcode scan/entry
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = mockProducts.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      toast({
        variant: "destructive",
        title: "Product not found",
        description: `No product with barcode ${barcodeInput}`,
      });
    }
  };
  
  // Add product to cart
  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      // Check if product is already in cart
      const existingItem = prevItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Product already in cart, increase quantity if stock allows
        if (existingItem.quantity >= product.stock_quantity) {
          toast({
            variant: "destructive",
            title: "Stock limit reached",
            description: `Only ${product.stock_quantity} available in stock.`,
          });
          return prevItems;
        }
        
        return prevItems.map(item => 
          item.product.id === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.selling_price 
              }
            : item
        );
      } else {
        // Add new product to cart
        return [
          ...prevItems,
          {
            product,
            quantity: 1,
            subtotal: product.selling_price
          }
        ];
      }
    });
  };
  
  // Update cart item quantity
  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    // Don't allow negative quantities
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // Find product to check stock
    const cartItem = cartItems.find(item => item.product.id === productId);
    if (!cartItem) return;
    
    // Check if new quantity exceeds stock
    if (newQuantity > cartItem.product.stock_quantity) {
      toast({
        variant: "destructive",
        title: "Stock limit reached",
        description: `Only ${cartItem.product.stock_quantity} available in stock.`,
      });
      return;
    }
    
    // Update quantity
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.product.selling_price
            }
          : item
      )
    );
  };
  
  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };
  
  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };
  
  // Handle checkout process
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty cart",
        description: "Please add items to cart before checkout.",
      });
      return;
    }
    
    setIsCheckoutDialogOpen(true);
  };
  
  // Process the payment and finalize sale
  const processPayment = (paymentMethod: string, amountPaid: number) => {
    // In a real app, this would update inventory, create a sale record, etc.
    console.log(`Processing payment: ${paymentMethod}`, { cartItems, amountPaid });
    
    // Show success message
    toast({
      title: "Sale completed!",
      description: `${cartItems.length} items sold for ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(cartTotal)}`,
    });
    
    // Clear cart after successful checkout
    clearCart();
    setIsCheckoutDialogOpen(false);
  };
  
  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Left side - Products */}
      <div className="w-full lg:w-2/3 h-full flex flex-col">
        {/* Search and filter bar */}
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <ProductSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            
            {/* Barcode scanner input */}
            <form onSubmit={handleBarcodeSubmit} className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="text"
                placeholder="Scan barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm">Scan</Button>
            </form>
          </div>
          
          {/* Category filter */}
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">All Categories</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">Clothing</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">Electronics</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">Household</MenubarTrigger>
            </MenubarMenu>
          </Menubar>
        </div>
        
        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</div>
                  <div>
                    <PackageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-1 font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currencyCode,
                    minimumFractionDigits: 0,
                  }).format(product.selling_price)}
                </div>
              </CardContent>
              <CardFooter className="p-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity === 0}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Right side - Cart */}
      <div className="w-full lg:w-1/3 bg-muted/30 rounded-lg p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Cart 
            <span className="ml-2 text-sm bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {cartItemCount}
            </span>
          </h2>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearCart}
            disabled={cartItems.length === 0}
            className="text-muted-foreground hover:text-destructive"
          >
            <Undo className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
        
        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mb-2 opacity-20" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add products to begin</p>
            </div>
          ) : (
            <CartDisplay 
              cartItems={cartItems}
              updateCartItemQuantity={updateCartItemQuantity}
              removeFromCart={removeFromCart}
              currencyCode={currencyCode}
            />
          )}
        </div>
        
        {/* Cart totals */}
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal</span>
            <span>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
              }).format(cartTotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span>Tax (0%)</span>
            <span>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
              }).format(0)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg mb-6">
            <span>Total</span>
            <span>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
              }).format(cartTotal)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full" disabled={cartItems.length === 0}>
              <Tag className="mr-2 h-4 w-4" />
              Apply Discount
            </Button>
            <Button className="w-full" onClick={handleCheckout} disabled={cartItems.length === 0}>
              <CreditCard className="mr-2 h-4 w-4" />
              Checkout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Checkout Dialog */}
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
