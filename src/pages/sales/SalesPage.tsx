
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/types";
import { useShop } from "@/context/ShopContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Card } from "@/components/ui/card";
import { ReceiptText, FilePlus, Search, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SaleWithItems {
  id: string;
  shop_id: string;
  user_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  customer_name?: string;
  receipt_number?: string;
  created_at: string;
  items: { product_id: string; product_name: string; quantity: number; unit_price: number; total: number }[];
}

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "mpesa", label: "Mpesa" },
  { value: "card", label: "Card" },
  { value: "credit", label: "Credit" }
];

const SalesPage: React.FC = () => {
  const { currentShop } = useShop();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleWithItems[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [addingSale, setAddingSale] = useState(false);

  useEffect(() => {
    if (currentShop) {
      loadData();
    }
  }, [currentShop]);

  const loadData = async () => {
    if (!currentShop) return;
    setLoading(true);

    const [productsRes, salesRes] = await Promise.all([
      supabase.from('products').select('*').eq('shop_id', currentShop.id).eq('is_active', true),
      supabase.from('sales').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false }).limit(100),
    ]);

    if (productsRes.data) setProducts(productsRes.data as Product[]);

    if (salesRes.data) {
      // Load sale items for each sale
      const saleIds = salesRes.data.map(s => s.id);
      const { data: itemsData } = await supabase
        .from('sale_items')
        .select('*')
        .in('sale_id', saleIds.length > 0 ? saleIds : ['none']);

      const salesWithItems: SaleWithItems[] = salesRes.data.map(sale => ({
        ...sale,
        items: (itemsData || []).filter(item => item.sale_id === sale.id).map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total: Number(item.total),
        })),
      }));
      setSales(salesWithItems);
    }

    setLoading(false);
  };

  const handleAddSale = async () => {
    if (!selectedProductId || quantity < 1 || !currentShop || !user) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    if (quantity > product.stock_quantity) {
      toast({ title: "Not enough stock", variant: "destructive" });
      return;
    }

    const unitPrice = product.selling_price;
    const lineTotal = unitPrice * quantity;

    try {
      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          shop_id: currentShop.id,
          user_id: user.id,
          subtotal: lineTotal,
          discount: 0,
          tax: 0,
          total: lineTotal,
          payment_method: paymentMethod,
          payment_status: 'paid',
          receipt_number: `REC-${Date.now()}`,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale item (stock is updated by trigger)
      const { error: itemError } = await supabase
        .from('sale_items')
        .insert({
          sale_id: saleData.id,
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          discount: 0,
          total: lineTotal,
        });

      if (itemError) throw itemError;

      toast({ title: "Sale recorded successfully!" });

      // Reset and reload
      setSelectedProductId("");
      setQuantity(1);
      setPaymentMethod(paymentMethods[0].value);
      setAddingSale(false);
      loadData();
    } catch (error: any) {
      console.error('Sale error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredSales = sales.filter(sale => {
    if (!search) return true;
    const s = search.toLowerCase();
    return sale.items.some(i => i.product_name.toLowerCase().includes(s)) ||
      sale.customer_name?.toLowerCase().includes(s) ||
      sale.receipt_number?.toLowerCase().includes(s);
  });

  const currency = currentShop?.currency || "KES";

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground">Select a shop to view sales.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ReceiptText className="w-7 h-7 text-primary" />
          {t("sales")}
        </h1>
        <Button onClick={() => setAddingSale(s => !s)} variant="default">
          <FilePlus className="w-4 h-4 mr-1" />
          Add Sale
        </Button>
      </div>

      {addingSale && (
        <Card className="p-4 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-medium">Product</label>
              <select className="block w-full border rounded px-3 py-2" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                <option value="">Select...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity} left)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Quantity</label>
              <Input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
            </div>
            <div>
              <label className="block mb-1 font-medium">Payment</label>
              <select className="block w-full border rounded px-3 py-2" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {paymentMethods.map(pm => (
                  <option key={pm.value} value={pm.value}>{pm.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddSale} disabled={!selectedProductId || quantity < 1}>
              <Plus className="mr-1" size={16} /> Save Sale
            </Button>
            <Button variant="ghost" onClick={() => setAddingSale(false)}>
              <X className="mr-1" size={16} /> Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="flex mb-4 items-center gap-2">
        <Input placeholder="Search by product or receipt..." className="max-w-sm" value={search} onChange={e => setSearch(e.target.value)} />
        <Search size={18} className="text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading sales...</div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No sales found.</div>
        ) : (
          filteredSales.map(sale => (
            <Card key={sale.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-3">
              <div className="flex-1">
                <div className="font-semibold">
                  {sale.items.map(i => i.product_name).join(", ")}
                  <span className="ml-2 text-xs text-muted-foreground">× {sale.items.map(i => i.quantity).join(", ")}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(sale.created_at).toLocaleString()}
                  {sale.receipt_number && <> • #{sale.receipt_number}</>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 mt-2 md:mt-0">
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(sale.total)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SalesPage;
