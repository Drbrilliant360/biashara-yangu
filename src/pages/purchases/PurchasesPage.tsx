
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Filter, Search, ShoppingCart, Truck, Trash2, Edit, Package, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { Product, TimeRange } from '@/types';

interface SupplierRecord {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  shop_id: string;
}

interface PurchaseLineItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PurchaseRecord {
  id: string;
  shop_id: string;
  user_id: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_phone?: string;
  items: PurchaseLineItem[];
  total_amount: number;
  payment_method: 'cash' | 'mpesa' | 'bank' | 'credit';
  payment_status: 'paid' | 'partial' | 'unpaid';
  amount_paid: number;
  balance: number;
  reference?: string;
  notes?: string;
  purchase_date: string;
  created_at: string;
}

type LegacySupplierRecord = Partial<SupplierRecord> & { shopId?: string };
type LegacyPurchaseLineItem = Partial<PurchaseLineItem> & {
  productId?: string;
  name?: string;
  unitCost?: number;
  subtotal?: number;
};
type LegacyPurchaseRecord = Partial<PurchaseRecord> & {
  shopId?: string;
  supplierId?: string;
  total?: number;
  paymentStatus?: PurchaseRecord['payment_status'];
  paymentMethod?: PurchaseRecord['payment_method'];
  amountPaid?: number;
  timestamp?: string;
  addedBy?: string;
  items?: LegacyPurchaseLineItem[];
};

const normalizeSupplier = (supplier: LegacySupplierRecord): SupplierRecord => ({
  id: supplier.id || crypto.randomUUID(),
  name: supplier.name || 'General Supplier',
  phone: supplier.phone,
  email: supplier.email,
  address: supplier.address,
  shop_id: supplier.shop_id || supplier.shopId || '',
});

const normalizePurchaseItem = (item: LegacyPurchaseLineItem): PurchaseLineItem => {
  const unitPrice = item.unit_price ?? item.unitCost ?? 0;
  const quantity = item.quantity ?? 0;

  return {
    product_id: item.product_id || item.productId || '',
    product_name: item.product_name || item.name || 'Unnamed product',
    quantity,
    unit_price: unitPrice,
    total: item.total ?? item.subtotal ?? quantity * unitPrice,
  };
};

const normalizePurchase = (purchase: LegacyPurchaseRecord): PurchaseRecord => {
  const items = (purchase.items || []).map(normalizePurchaseItem);
  const totalAmount = purchase.total_amount ?? purchase.total ?? items.reduce((sum, item) => sum + item.total, 0);
  const amountPaid = purchase.amount_paid ?? purchase.amountPaid ?? (purchase.payment_status === 'paid' || purchase.paymentStatus === 'paid' ? totalAmount : 0);
  const createdAt = purchase.created_at || purchase.timestamp || new Date().toISOString();

  return {
    id: purchase.id || crypto.randomUUID(),
    shop_id: purchase.shop_id || purchase.shopId || '',
    user_id: purchase.user_id || purchase.addedBy || '',
    supplier_id: purchase.supplier_id || purchase.supplierId,
    supplier_name: purchase.supplier_name,
    supplier_phone: purchase.supplier_phone,
    items,
    total_amount: totalAmount,
    payment_method: purchase.payment_method || purchase.paymentMethod || 'cash',
    payment_status: purchase.payment_status || purchase.paymentStatus || 'paid',
    amount_paid: amountPaid,
    balance: purchase.balance ?? Math.max(totalAmount - amountPaid, 0),
    reference: purchase.reference,
    notes: purchase.notes,
    purchase_date: purchase.purchase_date || createdAt.split('T')[0],
    created_at: createdAt,
  };
};

const PurchasesPage: React.FC = () => {
  const { toast } = useToast();
  const { currentShop } = useShop();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isViewPurchaseOpen, setIsViewPurchaseOpen] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<PurchaseRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  
  // New purchase form state
  const [supplierId, setSupplierId] = useState<string>('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseLineItem[]>([]);
  const [reference, setReference] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank' | 'credit'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('0');
  
  // Current item being added
  const [currentItemId, setCurrentItemId] = useState<string>('');
  const [currentItemQuantity, setCurrentItemQuantity] = useState<string>('1');
  const [currentItemUnitCost, setCurrentItemUnitCost] = useState<string>('');

  // Initialize local storage if needed
  useEffect(() => {
    if (!getItem(STORAGE_KEYS.EXPENSES, null)) {
      setItem(STORAGE_KEYS.EXPENSES, []);
    }
    
    // Initialize purchases storage if needed
    const purchasesKey = 'biashara_purchases';
    if (!getItem(purchasesKey, null)) {
      setItem(purchasesKey, []);
    }
    
    // Initialize suppliers storage if needed
    const suppliersKey = 'biashara_suppliers';
    if (!getItem(suppliersKey, null)) {
      setItem(suppliersKey, []);
    }
  }, []);

  useEffect(() => {
    if (currentShop) {
      loadPurchases();
      loadSuppliers();
      loadProducts();
    } else {
      setPurchases([]);
      setSuppliers([]);
      setProducts([]);
    }
  }, [currentShop]);

  const loadPurchases = () => {
    if (!currentShop) return;
    
    const allPurchases = getItem<LegacyPurchaseRecord[]>('biashara_purchases', [])
      .map(normalizePurchase)
      .filter(purchase => purchase.shop_id === currentShop.id);
    
    setPurchases(allPurchases);
  };

  const loadSuppliers = () => {
    if (!currentShop) return;
    
    const allSuppliers = getItem<LegacySupplierRecord[]>('biashara_suppliers', [])
      .map(normalizeSupplier)
      .filter(supplier => supplier.shop_id === currentShop.id);
    
    setSuppliers(allSuppliers);
    
    // Add a default supplier if none exists
    if (allSuppliers.length === 0) {
      const defaultSupplier: Supplier = {
        id: crypto.randomUUID(),
        name: 'General Supplier',
        shop_id: currentShop.id,
      };
      
      const updatedSuppliers = [...getItem<LegacySupplierRecord[]>('biashara_suppliers', []), defaultSupplier];
      setItem('biashara_suppliers', updatedSuppliers);
      setSuppliers([defaultSupplier]);
    }
  };

  const loadProducts = () => {
    if (!currentShop) return;
    
    const allProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, [])
      .filter(product => product.shop_id === currentShop.id);
    
    setProducts(allProducts);
  };

  const calculatePurchaseTotal = (items: PurchaseLineItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleAddItem = () => {
    if (!currentItemId || !currentItemQuantity || !currentItemUnitCost) {
      toast({
        title: "Missing information",
        description: "Please select a product and enter quantity and cost",
        variant: "destructive",
      });
      return;
    }
    
    const product = products.find(p => p.id === currentItemId);
    if (!product) return;
    
    const quantity = parseInt(currentItemQuantity);
    const unitCost = parseFloat(currentItemUnitCost);
    
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(unitCost) || unitCost <= 0) {
      toast({
        title: "Invalid unit cost",
        description: "Unit cost must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    const newItem: PurchaseLineItem = {
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: unitCost,
      total: quantity * unitCost,
    };
    
    // Check if product already exists in the list
    const existingItemIndex = purchaseItems.findIndex(item => item.product_id === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...purchaseItems];
      const existingItem = updatedItems[existingItemIndex];
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
        unit_price: unitCost,
        total: (existingItem.quantity + quantity) * unitCost,
      };
      
      setPurchaseItems(updatedItems);
      
      toast({
        title: "Item updated",
        description: `${product.name} quantity increased to ${existingItem.quantity + quantity}`
      });
    } else {
      // Add new item
      setPurchaseItems([...purchaseItems, newItem]);
      
      toast({
        title: "Item added",
        description: `${product.name} added to purchase`
      });
    }
    
    // Reset item form
    setCurrentItemId('');
    setCurrentItemQuantity('1');
    setCurrentItemUnitCost('');
  };

  const removeItem = (index: number) => {
    const updatedItems = [...purchaseItems];
    updatedItems.splice(index, 1);
    setPurchaseItems(updatedItems);
  };

  const addPurchase = () => {
    if (!currentShop || !user) {
      toast({
        title: "Error",
        description: "Shop or user data missing",
        variant: "destructive",
      });
      return;
    }
    
    if (purchaseItems.length === 0) {
      toast({
        title: "No items",
        description: "Please add at least one item to the purchase",
        variant: "destructive",
      });
      return;
    }
    
    const total = calculatePurchaseTotal(purchaseItems);
    const amountPaidValue = parseFloat(amountPaid);
    
    if (isNaN(amountPaidValue) || amountPaidValue < 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount paid",
        variant: "destructive",
      });
      return;
    }
    
    const createdAt = new Date().toISOString();

    const newPurchase: PurchaseRecord = {
      id: crypto.randomUUID(),
      shop_id: currentShop.id,
      user_id: user.id,
      supplier_id: supplierId || undefined,
      items: purchaseItems,
      total_amount: total,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      amount_paid: amountPaidValue,
      balance: total - amountPaidValue,
      reference: reference || undefined,
      purchase_date: createdAt.split('T')[0],
      created_at: createdAt,
    };

    const updatedPurchases = [...getItem<PurchaseRecord[]>('biashara_purchases', []), newPurchase];
    setItem('biashara_purchases', updatedPurchases);
    
    // Update product stock quantities
    const allProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const updatedProducts = allProducts.map(product => {
      const purchaseItem = purchaseItems.find(item => item.product_id === product.id);
      if (purchaseItem) {
        return {
          ...product,
          stock_quantity: product.stock_quantity + purchaseItem.quantity,
          buying_price: purchaseItem.unit_price,
        };
      }
      return product;
    });
    
    setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
    
    // Reset form and reload data
    setPurchaseItems([]);
    setSupplierId('');
    setReference('');
    setPaymentStatus('paid');
    setPaymentMethod('cash');
    setAmountPaid('0');
    setIsAddPurchaseOpen(false);
    loadPurchases();
    loadProducts();
    
    toast({
      title: "Purchase recorded",
      description: `${purchaseItems.length} items purchased for ${formatCurrency(total)}`,
    });
  };

  const viewPurchase = (purchase: PurchaseRecord) => {
    setCurrentPurchase(purchase);
    setIsViewPurchaseOpen(true);
  };

  const filterPurchases = () => {
    if (!purchases.length) return [];
    
    let filtered = [...purchases];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(purchase => 
        purchase.reference?.toLowerCase().includes(term) ||
        (purchase.supplier_id && getSupplierName(purchase.supplier_id).toLowerCase().includes(term))
      );
    }
    
    // Filter by supplier
    if (selectedSupplier !== 'all') {
      filtered = filtered.filter(purchase => purchase.supplier_id === selectedSupplier);
    }
    
    // Filter by time range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        // For 'all' or 'custom', don't filter by date
        break;
    }
    
    filtered = filtered.filter(purchase => new Date(purchase.created_at) >= startDate);
    
    // Sort by newest first
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSupplierName = (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    return supplier ? supplier.name : 'Unknown Supplier';
  };

  const getPaymentStatusColor = (status: 'paid' | 'partial' | 'unpaid') => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPurchases = filterPurchases().reduce((sum, purchase) => sum + purchase.total_amount, 0);
  
  // Don't show the page if no shop is selected
  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You need to select a shop before you can manage purchases.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchases & Stock</h1>
        <Button onClick={() => setIsAddPurchaseOpen(true)} className="bg-biashara-primary">
          <Plus size={18} className="mr-1" /> Record Purchase
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="p-4 flex-1">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search size={18} className="text-gray-500" />
              <Input 
                placeholder="Search purchases..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-[140px]">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Filter by time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="w-[160px]">
                  <Truck size={16} className="mr-2" />
                  <SelectValue placeholder="Filter by supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="overflow-hidden border">
        <div className="p-4 bg-muted/50 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Purchase List 
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filterPurchases().length} purchases)
              </span>
            </h2>
            <div className="text-md font-semibold">
              Total: {formatCurrency(totalPurchases)}
            </div>
          </div>
        </div>
        
        {filterPurchases().length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filterPurchases().map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{formatDate(purchase.created_at)}</TableCell>
                  <TableCell>
                    {purchase.supplier_id ? getSupplierName(purchase.supplier_id) : 'N/A'}
                  </TableCell>
                  <TableCell>{purchase.items.length} items</TableCell>
                  <TableCell>{purchase.reference || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(purchase.payment_status)}`}>
                      {purchase.payment_status.charAt(0).toUpperCase() + purchase.payment_status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(purchase.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => viewPurchase(purchase)}
                    >
                      <Receipt size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart size={48} className="text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No purchases found</p>
            <Button
              variant="link"
              onClick={() => setIsAddPurchaseOpen(true)}
              className="mt-2"
            >
              Record your first purchase
            </Button>
          </div>
        )}
      </Card>

      {/* Add Purchase Dialog */}
      <Dialog open={isAddPurchaseOpen} onOpenChange={setIsAddPurchaseOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record New Purchase</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Supplier</label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Reference (Optional)</label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Invoice or reference number"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select 
                    value={paymentStatus} 
                    onValueChange={(value: 'paid' | 'partial' | 'unpaid') => {
                      setPaymentStatus(value);
                      if (value === 'paid') {
                        setAmountPaid(calculatePurchaseTotal(purchaseItems).toString());
                      } else if (value === 'unpaid') {
                        setAmountPaid('0');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select 
                    value={paymentMethod} 
                    onValueChange={(value: 'cash' | 'mpesa' | 'bank' | 'credit') => setPaymentMethod(value)}
                    disabled={paymentStatus === 'unpaid'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="credit">Credit/Terms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Amount Paid ({currentShop.currency})</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  disabled={paymentStatus === 'unpaid'}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border p-3 rounded-md">
                <h3 className="font-medium mb-2">Add Items</h3>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-sm">Product</label>
                    <Select value={currentItemId} onValueChange={setCurrentItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={currentItemQuantity}
                        onChange={(e) => setCurrentItemQuantity(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm">Unit Cost</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentItemUnitCost}
                        onChange={(e) => setCurrentItemUnitCost(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddItem}
                    variant="outline" 
                    className="w-full mt-2"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Items ({purchaseItems.length})</h3>
                {purchaseItems.length > 0 ? (
                  <div className="border rounded-md divide-y max-h-[240px] overflow-y-auto">
                    {purchaseItems.map((item, index) => (
                      <div key={index} className="p-2 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{formatCurrency(item.total)}</div>
                          <Button 
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 text-red-500"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border rounded-md text-muted-foreground">
                    No items added yet
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-4 font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(calculatePurchaseTotal(purchaseItems))}</span>
                </div>
                
                {paymentStatus === 'partial' && (
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-muted-foreground">Balance:</span>
                    <span>{formatCurrency(calculatePurchaseTotal(purchaseItems) - parseFloat(amountPaid || '0'))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPurchaseOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={addPurchase}
              className="bg-biashara-primary"
              disabled={purchaseItems.length === 0}
            >
              Save Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Purchase Dialog */}
      <Dialog open={isViewPurchaseOpen} onOpenChange={setIsViewPurchaseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Purchase Details</span>
              <span className="text-sm font-normal">
                {currentPurchase && formatDate(currentPurchase.created_at)}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {currentPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">
                    {currentPurchase.supplier_id ? getSupplierName(currentPurchase.supplier_id) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-medium">{currentPurchase.reference || 'N/A'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Items</h3>
                <div className="max-h-[240px] overflow-y-auto space-y-2">
                  {currentPurchase.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-1">
                  <p>Total</p>
                  <p className="font-bold">{formatCurrency(currentPurchase.total_amount)}</p>
                </div>
                
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Payment Status</p>
                  <p className={`text-sm ${currentPurchase.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                    {currentPurchase.payment_status.charAt(0).toUpperCase() + currentPurchase.payment_status.slice(1)}
                  </p>
                </div>
                
                {currentPurchase.payment_status !== 'unpaid' && (
                  <div className="flex justify-between mb-1">
                    <p className="text-sm">Payment Method</p>
                    <p className="text-sm">{currentPurchase.payment_method}</p>
                  </div>
                )}
                
                {currentPurchase.payment_status === 'partial' && (
                  <>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm">Amount Paid</p>
                      <p className="text-sm">{formatCurrency(currentPurchase.amount_paid)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm">Balance</p>
                      <p className="text-sm text-red-600">{formatCurrency(currentPurchase.balance)}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasesPage;
