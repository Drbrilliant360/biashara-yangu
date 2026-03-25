
import React, { useEffect, useState } from "react";
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product, Customer } from "@/types";
import { useShop } from "@/context/ShopContext";
import { useLanguage } from "@/context/LanguageContext";
import { Card } from "@/components/ui/card";
import { ReceiptText, FilePlus, Search, Plus, X } from "lucide-react";

interface SaleLineItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total: number;
}

interface SaleRecord {
  id: string;
  shop_id: string;
  user_id: string;
  items: SaleLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  customer_id?: string;
  receipt_number?: string;
  created_at: string;
}

type LegacyCustomer = Customer & { shopId?: string };
type LegacySaleLineItem = Partial<SaleLineItem> & {
  productId?: string;
  name?: string;
  price?: number;
  subtotal?: number;
};
type LegacySaleRecord = Partial<SaleRecord> & {
  shopId?: string;
  items?: LegacySaleLineItem[];
  paymentMethod?: string;
  customerId?: string;
  cashierId?: string;
  timestamp?: string;
  receiptNumber?: string;
};

const normalizeCustomer = (customer: LegacyCustomer): Customer => ({
  ...customer,
  shop_id: customer.shop_id || customer.shopId || '',
});

const normalizeSaleItem = (item: LegacySaleLineItem): SaleLineItem => {
  const unitPrice = item.unit_price ?? item.price ?? 0;
  const quantity = item.quantity ?? 0;

  return {
    product_id: item.product_id || item.productId || '',
    product_name: item.product_name || item.name || 'Unnamed product',
    unit_price: unitPrice,
    quantity,
    total: item.total ?? item.subtotal ?? unitPrice * quantity,
  };
};

const normalizeSale = (sale: LegacySaleRecord): SaleRecord => {
  const items = (sale.items || []).map(normalizeSaleItem);
  const subtotal = sale.subtotal ?? items.reduce((sum, item) => sum + item.total, 0);
  const tax = sale.tax ?? 0;
  const discount = sale.discount ?? 0;

  return {
    id: sale.id || `${Date.now()}`,
    shop_id: sale.shop_id || sale.shopId || '',
    user_id: sale.user_id || sale.cashierId || 'demo',
    items,
    subtotal,
    discount,
    tax,
    total: sale.total ?? Math.max(subtotal + tax - discount, 0),
    payment_method: sale.payment_method || sale.paymentMethod || 'cash',
    payment_status: sale.payment_status || 'paid',
    customer_id: sale.customer_id || sale.customerId,
    receipt_number: sale.receipt_number || sale.receiptNumber,
    created_at: sale.created_at || sale.timestamp || new Date().toISOString(),
  };
};

// Payment methods
const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "mpesa", label: "Mpesa" },
  { value: "card", label: "Card" },
  { value: "credit", label: "Credit" }
];

const SalesPage: React.FC = () => {
  const { currentShop } = useShop();
  const { t } = useLanguage();

  // Load products, customers, and existing sales
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [search, setSearch] = useState("");
  
  // New sale form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [addingSale, setAddingSale] = useState(false);

  // Filtered products for shop
  useEffect(() => {
    if (!currentShop) return;
    setProducts(getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []).filter((p) => p.shop_id === currentShop.id));
    setCustomers(getItem<LegacyCustomer[]>(STORAGE_KEYS.CUSTOMERS, []).map(normalizeCustomer).filter((c) => c.shop_id === currentShop.id));
    setSales(getItem<LegacySaleRecord[]>(STORAGE_KEYS.SALES, []).map(normalizeSale).filter((s) => s.shop_id === currentShop.id));
  }, [currentShop]);

  // Handle Add Sale
  const handleAddSale = () => {
    if (!selectedProductId || quantity < 1) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    if (quantity > product.stock_quantity) {
      alert("Not enough stock.");
      return;
    }

    const unitPrice = product.selling_price;
    const lineTotal = unitPrice * quantity;

    const newSale: SaleRecord = {
      id: `${Date.now()}`,
      shop_id: currentShop!.id,
      user_id: "demo",
      items: [{
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity,
        total: lineTotal,
      }],
      subtotal: lineTotal,
      discount: 0,
      tax: 0,
      total: lineTotal,
      payment_method: paymentMethod,
      payment_status: "paid",
      customer_id: selectedCustomerId || undefined,
      created_at: new Date().toISOString(),
      receipt_number: (1000 + sales.length).toString(),
    };

    // Update product stock
    const updatedProducts = products.map(p =>
      p.id === product.id
        ? { ...p, stock_quantity: p.stock_quantity - quantity }
        : p
    );
    setProducts(updatedProducts);
    setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // Save new sale
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    setItem(STORAGE_KEYS.SALES, updatedSales);

    // Reset form
    setSelectedProductId("");
    setSelectedCustomerId("");
    setQuantity(1);
    setPaymentMethod(paymentMethods[0].value);
    setAddingSale(false);
  };

  // Filtered sales by product or customer name
  const filteredSales = sales.filter(sale => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      sale.items.some(i => i.product_name.toLowerCase().includes(searchLower)) ||
      (sale.customer_id && customers.find(c => c.id === sale.customer_id)?.name.toLowerCase().includes(searchLower))
    );
  });

  // Currency
  const currency = currentShop?.currency || "KES";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ReceiptText className="w-7 h-7 text-biashara-primary" />
          {t("sales")}
        </h1>
        <Button onClick={() => setAddingSale(s => !s)} variant="default">
          <FilePlus className="w-4 h-4 mr-1" />
          Add Sale
        </Button>
      </div>

      {/* Add Sale Form */}
      {addingSale && (
        <Card className="p-4 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1 font-medium">Product</label>
              <select
                className="block w-full border rounded px-3 py-2"
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
              >
                <option value="">Select...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity} left)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Quantity</label>
              <Input
                type="number"
                min={1}
                max={selectedProductId ? (products.find(p => p.id === selectedProductId)?.stock_quantity ?? 1) : 1}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Customer</label>
              <select
                className="block w-full border rounded px-3 py-2"
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Walk-in</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Payment</label>
              <select
                className="block w-full border rounded px-3 py-2"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                {paymentMethods.map(pm => (
                  <option key={pm.value} value={pm.value}>{pm.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="default" onClick={handleAddSale} disabled={!selectedProductId || quantity < 1}>
              <Plus className="mr-1" size={16} />
              Save Sale
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAddingSale(false)}>
              <X className="mr-1" size={16} />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search sales */}
      <div className="flex mb-4 items-center gap-2">
        <Input
          placeholder="Search by product or customer..."
          className="max-w-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Search size={18} className="text-muted-foreground" />
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <div className="text-center text-muted-foreground">No sales found.</div>
        ) : (
          filteredSales.map(sale => (
            <Card key={sale.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-3">
              <div className="flex-1">
                <div className="font-semibold">
                  {sale.items.map(i => i.product_name).join(", ")}
                  <span className="ml-2 text-xs text-gray-400">
                    × {sale.items.map(i => i.quantity).join(", ")}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(sale.created_at).toLocaleString()}
                  {sale.customer_id && (
                    <> • {customers.find(c => c.id === sale.customer_id)?.name || "Customer"}</>
                  )}
                  <> • #{sale.receipt_number}</>
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
