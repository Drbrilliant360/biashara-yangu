
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Filter, Search, Truck, Trash2, Package, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, TimeRange } from '@/types';

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
  supplier_name?: string;
  supplier_phone?: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  notes?: string;
  purchase_date: string;
  created_at: string;
  items: PurchaseLineItem[];
}

const PurchasesPage: React.FC = () => {
  const { toast } = useToast();
  const { currentShop } = useShop();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isViewPurchaseOpen, setIsViewPurchaseOpen] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<PurchaseRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [loading, setLoading] = useState(false);

  // Form state
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseLineItem[]>([]);
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // Current item being added
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentItemQuantity, setCurrentItemQuantity] = useState('1');
  const [currentItemUnitCost, setCurrentItemUnitCost] = useState('');

  useEffect(() => {
    if (currentShop) loadData();
  }, [currentShop]);

  const loadData = async () => {
    if (!currentShop) return;
    setLoading(true);

    const [productsRes, purchasesRes] = await Promise.all([
      supabase.from('products').select('*').eq('shop_id', currentShop.id).eq('is_active', true),
      supabase.from('purchases').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false }),
    ]);

    if (productsRes.data) setProducts(productsRes.data as Product[]);

    if (purchasesRes.data) {
      const purchaseIds = purchasesRes.data.map(p => p.id);
      const { data: itemsData } = await supabase
        .from('purchase_items')
        .select('*')
        .in('purchase_id', purchaseIds.length > 0 ? purchaseIds : ['none']);

      const purchasesWithItems: PurchaseRecord[] = purchasesRes.data.map(p => ({
        ...p,
        total_amount: Number(p.total_amount),
        items: (itemsData || []).filter(item => item.purchase_id === p.id).map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total: Number(item.total),
        })),
      }));
      setPurchases(purchasesWithItems);
    }

    setLoading(false);
  };

  const handleAddItem = () => {
    if (!currentItemId || !currentItemQuantity || !currentItemUnitCost) {
      toast({ title: "Missing information", variant: "destructive" });
      return;
    }
    const product = products.find(p => p.id === currentItemId);
    if (!product) return;

    const quantity = parseInt(currentItemQuantity);
    const unitCost = parseFloat(currentItemUnitCost);
    if (quantity <= 0 || unitCost <= 0) {
      toast({ title: "Invalid values", variant: "destructive" });
      return;
    }

    const existingIdx = purchaseItems.findIndex(item => item.product_id === product.id);
    if (existingIdx >= 0) {
      const updated = [...purchaseItems];
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: updated[existingIdx].quantity + quantity,
        unit_price: unitCost,
        total: (updated[existingIdx].quantity + quantity) * unitCost,
      };
      setPurchaseItems(updated);
    } else {
      setPurchaseItems([...purchaseItems, {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitCost,
        total: quantity * unitCost,
      }]);
    }

    setCurrentItemId(''); setCurrentItemQuantity('1'); setCurrentItemUnitCost('');
  };

  const removeItem = (index: number) => {
    setPurchaseItems(prev => prev.filter((_, i) => i !== index));
  };

  const addPurchase = async () => {
    if (!currentShop || !user) return;
    if (purchaseItems.length === 0) {
      toast({ title: "No items", description: "Add at least one item", variant: "destructive" });
      return;
    }

    const total = purchaseItems.reduce((sum, item) => sum + item.total, 0);

    try {
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          shop_id: currentShop.id,
          user_id: user.id,
          supplier_name: supplierName || null,
          supplier_phone: supplierPhone || null,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          notes: notes || null,
          purchase_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Insert purchase items (triggers update stock)
      const items = purchaseItems.map(item => ({
        purchase_id: purchaseData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase.from('purchase_items').insert(items);
      if (itemsError) throw itemsError;

      // Reset form
      setPurchaseItems([]); setSupplierName(''); setSupplierPhone('');
      setPaymentStatus('paid'); setPaymentMethod('cash'); setNotes('');
      setIsAddPurchaseOpen(false);
      loadData();

      toast({ title: "Purchase recorded", description: `${purchaseItems.length} items purchased for ${formatCurrency(total)}` });
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filterPurchases = () => {
    let filtered = [...purchases];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.supplier_name?.toLowerCase().includes(term) || p.notes?.toLowerCase().includes(term));
    }

    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'yesterday': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); break;
      case 'week': startDate = new Date(now.getTime() - 7 * 86400000); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
    }

    filtered = filtered.filter(p => new Date(p.created_at) >= startDate);
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currentShop?.currency || 'KES', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const totalPurchases = filterPurchases().reduce((sum, p) => sum + p.total_amount, 0);

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground">Select a shop to manage purchases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchases & Stock</h1>
        <Button onClick={() => setIsAddPurchaseOpen(true)}><Plus size={18} className="mr-1" /> Record Purchase</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Search purchases..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
            <SelectTrigger className="w-[140px]"><Filter size={16} className="mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden border">
        <div className="p-4 bg-muted/50 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Purchase List <span className="text-sm font-normal text-muted-foreground ml-2">({filterPurchases().length})</span></h2>
            <div className="font-semibold">Total: {formatCurrency(totalPurchases)}</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filterPurchases().length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filterPurchases().map(purchase => (
                <TableRow key={purchase.id}>
                  <TableCell>{formatDate(purchase.created_at)}</TableCell>
                  <TableCell>{purchase.supplier_name || 'N/A'}</TableCell>
                  <TableCell>{purchase.items.length} items</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      purchase.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {purchase.payment_status.charAt(0).toUpperCase() + purchase.payment_status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(purchase.total_amount)}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => { setCurrentPurchase(purchase); setIsViewPurchaseOpen(true); }}>
                      <Receipt size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Package size={48} className="text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No purchases found</p>
            <Button variant="link" onClick={() => setIsAddPurchaseOpen(true)} className="mt-2">Record your first purchase</Button>
          </div>
        )}
      </Card>

      {/* Add Purchase Dialog */}
      <Dialog open={isAddPurchaseOpen} onOpenChange={setIsAddPurchaseOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record New Purchase</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Supplier Name</label>
                <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Supplier name" />
              </div>
              <div>
                <label className="text-sm font-medium">Supplier Phone</label>
                <Input value={supplierPhone} onChange={e => setSupplierPhone(e.target.value)} placeholder="Phone" />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Add Items</h3>
              <div className="grid grid-cols-3 gap-2">
                <select className="border rounded px-2 py-2 text-sm" value={currentItemId} onChange={e => { setCurrentItemId(e.target.value); const p = products.find(pp => pp.id === e.target.value); if (p) setCurrentItemUnitCost(p.buying_price.toString()); }}>
                  <option value="">Select product</option>
                  {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
                <Input type="number" placeholder="Qty" value={currentItemQuantity} onChange={e => setCurrentItemQuantity(e.target.value)} />
                <div className="flex gap-1">
                  <Input type="number" placeholder="Unit cost" value={currentItemUnitCost} onChange={e => setCurrentItemUnitCost(e.target.value)} />
                  <Button size="sm" onClick={handleAddItem}><Plus size={14} /></Button>
                </div>
              </div>

              {purchaseItems.length > 0 && (
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Cost</TableHead><TableHead>Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {purchaseItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{formatCurrency(item.total)}</TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => removeItem(idx)}><Trash2 size={14} /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Payment Status</label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>

            <div className="text-right font-bold text-lg">
              Total: {formatCurrency(purchaseItems.reduce((sum, item) => sum + item.total, 0))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPurchaseOpen(false)}>Cancel</Button>
            <Button onClick={addPurchase}>Save Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Purchase Dialog */}
      <Dialog open={isViewPurchaseOpen} onOpenChange={setIsViewPurchaseOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Purchase Details</DialogTitle></DialogHeader>
          {currentPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Date:</strong> {formatDate(currentPurchase.created_at)}</div>
                <div><strong>Supplier:</strong> {currentPurchase.supplier_name || 'N/A'}</div>
                <div><strong>Payment:</strong> {currentPurchase.payment_method}</div>
                <div><strong>Status:</strong> {currentPurchase.payment_status}</div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Cost</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {currentPurchase.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right font-bold">Total: {formatCurrency(currentPurchase.total_amount)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasesPage;
