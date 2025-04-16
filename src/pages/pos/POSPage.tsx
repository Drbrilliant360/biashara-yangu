
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Search, ShoppingCart, Trash2, CreditCard, BanknoteIcon, Phone, Barcode, Percent, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { Product, Sale, CartItem } from '@/types';
import { ProductSearch } from './components/ProductSearch';
import { CartDisplay } from './components/CartDisplay';
import { CheckoutDialog } from './components/CheckoutDialog';

const POSPage: React.FC = () => {
  const { currentShop } = useShop();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State for cart items, products, and UI
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isBarcodeMode, setIsBarcodeMode] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + item.subtotal, 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  // Load products on component mount
  useEffect(() => {
    if (currentShop) {
      loadProducts();
    }
  }, [currentShop]);

  // Extract categories from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter((category): category is string => category !== undefined)
        )
      );
      setCategories(uniqueCategories);
    }
  }, [products]);

  const loadProducts = () => {
    if (!currentShop) return;
    
    try {
      const allProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const shopProducts = allProducts.filter(
        (product) => product.shopId === currentShop.id && product.isActive
      );
      setProducts(shopProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      // Check if product is already in cart
      const existingItemIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        updatedItems[existingItemIndex].subtotal = 
          updatedItems[existingItemIndex].quantity * product.price;
        return updatedItems;
      } else {
        // Add new item to cart
        return [
          ...prevItems,
          {
            product,
            quantity: 1,
            subtotal: product.price,
          },
        ];
      }
    });
  };

  // Update item quantity in cart
  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.product.price,
            }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Handle barcode scanning
  const handleBarcodeSearch = () => {
    if (!barcodeValue.trim()) return;
    
    const product = products.find(p => p.barcode === barcodeValue.trim());
    if (product) {
      addToCart(product);
      setBarcodeValue('');
      toast({
        title: 'Product found',
        description: `Added ${product.name} to cart`,
      });
    } else {
      toast({
        title: 'Product not found',
        description: 'No product with this barcode',
        variant: 'destructive',
      });
    }
  };

  // Handle checkout process
  const handleCheckout = async (paymentMethod: 'cash' | 'mpesa' | 'card' | 'credit') => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add products before checkout',
        variant: 'destructive',
      });
      return;
    }

    if (!currentShop || !user) {
      toast({
        title: 'Error',
        description: 'Missing shop or user information',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create sale record
      const sale: Sale = {
        id: `sale_${Date.now()}`,
        shopId: currentShop.id,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        total: cartTotal,
        paymentMethod,
        cashierId: user.id,
        timestamp: new Date().toISOString(),
        receiptNumber: `RCT-${Math.floor(Math.random() * 10000)}-${new Date().getDate()}${new Date().getMonth() + 1}`,
      };

      // Save to local storage
      const allSales = getItem<Sale[]>(STORAGE_KEYS.SALES, []);
      const updatedSales = [...allSales, sale];
      setItem(STORAGE_KEYS.SALES, updatedSales);

      // Update product quantities
      const allProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const updatedProducts = allProducts.map((product) => {
        const cartItem = cartItems.find((item) => item.product.id === product.id);
        if (cartItem) {
          return {
            ...product,
            stockQuantity: product.stockQuantity - cartItem.quantity,
          };
        }
        return product;
      });
      setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);

      // Reset UI
      setIsCheckoutOpen(false);
      clearCart();
      loadProducts();

      toast({
        title: 'Sale completed',
        description: `Receipt #${sale.receiptNumber}`,
      });
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: 'Error',
        description: 'Failed to process sale',
        variant: 'destructive',
      });
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You need to add a shop before you can use the POS.
        </p>
        <Button onClick={() => navigate('/shops/add')}>
          Add Your First Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Left side - Products */}
      <div className="md:w-2/3 bg-muted/30 p-4 overflow-auto">
        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={isBarcodeMode ? "Scan or enter barcode" : "Search products..."}
                value={isBarcodeMode ? barcodeValue : searchTerm}
                onChange={(e) => isBarcodeMode ? setBarcodeValue(e.target.value) : setSearchTerm(e.target.value)}
                className="w-full"
                autoFocus={isBarcodeMode}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isBarcodeMode) {
                    handleBarcodeSearch();
                  }
                }}
              />
            </div>
            <Button
              variant={isBarcodeMode ? "default" : "outline"}
              size="icon"
              onClick={() => {
                setIsBarcodeMode(!isBarcodeMode);
                setBarcodeValue('');
                setSearchTerm('');
              }}
            >
              <Barcode size={18} />
            </Button>
            {isBarcodeMode && (
              <Button onClick={handleBarcodeSearch}>
                Find
              </Button>
            )}
          </div>
          
          {/* Category filter tabs */}
          {categories.length > 0 && (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full overflow-x-auto flex-nowrap justify-start h-auto pb-1 mb-2">
                <TabsTrigger value="all" onClick={() => setSelectedCategory(null)}>
                  All
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-16 md:pb-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`cursor-pointer h-full hover:border-primary transition-colors ${
                  product.stockQuantity <= 0 ? 'opacity-50' : ''
                }`}
                onClick={() => {
                  if (product.stockQuantity > 0) {
                    addToCart(product);
                  } else {
                    toast({
                      title: "Out of stock",
                      description: `${product.name} is out of stock.`,
                      variant: "destructive",
                    });
                  }
                }}
              >
                <CardContent className="p-3 flex flex-col h-full">
                  <div className="mb-2 text-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-24 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-full h-24 bg-muted flex items-center justify-center">
                        <Package size={32} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                    <div className="text-muted-foreground text-xs">
                      {product.stockQuantity === 0 ? (
                        <Badge variant="destructive" className="mt-1">Out of stock</Badge>
                      ) : product.stockQuantity < 5 ? (
                        <Badge variant="outline" className="text-amber-500 border-amber-500 mt-1">Low stock: {product.stockQuantity}</Badge>
                      ) : (
                        <span className="block mt-1 opacity-70">Stock: {product.stockQuantity}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currentShop.currency,
                      minimumFractionDigits: 0,
                    }).format(product.price)}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground text-center">
              {products.length === 0
                ? "No products added yet. Go to Products page to add your inventory."
                : "No products match your search."}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="md:w-1/3 bg-card border-l flex flex-col h-full">
        <div className="p-4 bg-muted/30 border-b">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Current Sale</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              disabled={cartItems.length === 0}
              className="h-8 px-2 text-muted-foreground"
            >
              <Trash2 size={16} className="mr-1" /> Clear
            </Button>
          </div>
        </div>
        
        {/* Cart items */}
        <div className="flex-1 overflow-auto p-4">
          {cartItems.length > 0 ? (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex-1 pr-2">
                    <div className="font-medium text-sm">{item.product.name}</div>
                    <div className="text-sm opacity-70">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currentShop.currency,
                        minimumFractionDigits: 0,
                      }).format(item.product.price)} × {item.quantity}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus size={16} />
                    </Button>
                    
                    <span className="w-8 text-center">{item.quantity}</span>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stockQuantity}
                    >
                      <Plus size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                  
                  <div className="w-20 text-right font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currentShop.currency,
                      minimumFractionDigits: 0,
                    }).format(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-center">
              <div>
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                <p>Cart is empty</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Cart totals and checkout */}
        <div className="border-t p-4">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Items:</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currentShop.currency,
                  minimumFractionDigits: 0,
                }).format(cartTotal)}
              </span>
            </div>
          </div>

          <Button
            className="w-full bg-biashara-primary hover:bg-biashara-primary/90 text-white"
            size="lg"
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cartItems.length === 0}
          >
            <ShoppingCart className="mr-2" size={18} /> Pay Now
          </Button>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <Button variant="secondary" size="sm" onClick={() => cartItems.length > 0 && handleCheckout('cash')}>
              <BanknoteIcon size={16} className="mr-1" /> Cash
            </Button>
            <Button variant="secondary" size="sm" onClick={() => cartItems.length > 0 && handleCheckout('mpesa')}>
              <Phone size={16} className="mr-1" /> M-Pesa
            </Button>
            <Button variant="secondary" size="sm" onClick={() => cartItems.length > 0 && handleCheckout('card')}>
              <CreditCard size={16} className="mr-1" /> Card
            </Button>
          </div>
        </div>
      </div>

      {/* Checkout dialog */}
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        cartItems={cartItems}
        cartTotal={cartTotal}
        handleCheckout={handleCheckout}
        currencyCode={currentShop.currency}
      />
    </div>
  );
};

export default POSPage;
