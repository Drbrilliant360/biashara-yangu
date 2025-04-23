
import React, { useEffect, useState } from "react";
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Product, Sale, Customer } from "@/types";
import { useShop } from "@/context/ShopContext";
import { useLanguage } from "@/context/LanguageContext";
import { Card } from "@/components/ui/card";
import { CreditCard, ReceiptText, FilePlus, Search, Plus, X } from "lucide-react";

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
  const [sales, setSales] = useState<Sale[]>([]);
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
    setProducts(getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []).filter(p => p.shopId === currentShop.id));
    setCustomers(getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []).filter(c => c.shopId === currentShop.id));
    setSales(getItem<Sale[]>(STORAGE_KEYS.SALES, []).filter(s => s.shopId === currentShop.id));
  }, [currentShop]);

  // Handle Add Sale
  const handleAddSale = () => {
    if (!selectedProductId || quantity < 1) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    if (quantity > product.stockQuantity) {
      alert("Not enough stock.");
      return;
    }

    const newSale: Sale = {
      id: `${Date.now()}`,
      shopId: currentShop!.id,
      items: [{
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
      }],
      total: product.price * quantity,
      paymentMethod: paymentMethod as Sale["paymentMethod"],
      customerId: selectedCustomerId || undefined,
      cashierId: "demo", // should be current user
      timestamp: new Date().toISOString(),
      receiptNumber: (1000 + sales.length).toString(),
    };

    // Update product stock
    const updatedProducts = products.map(p =>
      p.id === product.id
        ? { ...p, stockQuantity: p.stockQuantity - quantity }
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
      sale.items.some(i => i.name.toLowerCase().includes(searchLower)) ||
      (sale.customerId && customers.find(c => c.id === sale.customerId)?.name.toLowerCase().includes(searchLower))
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
                  <option key={p.id} value={p.id}>{p.name} ({p.stockQuantity} left)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Quantity</label>
              <Input
                type="number"
                min={1}
                max={selectedProductId ? (products.find(p => p.id === selectedProductId)?.stockQuantity ?? 1) : 1}
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
                  {sale.items.map(i => i.name).join(", ")}
                  <span className="ml-2 text-xs text-gray-400">
                    × {sale.items.map(i => i.quantity).join(", ")}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(sale.timestamp).toLocaleString()}
                  {sale.customerId && (
                    <> • {customers.find(c => c.id === sale.customerId)?.name || "Customer"}</>
                  )}
                  <> • #{sale.receiptNumber}</>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 mt-2 md:mt-0">
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(sale.total)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
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
