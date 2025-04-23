
// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: "owner" | "manager" | "cashier";
  shops: string[]; // shop IDs the user has access to
  phone?: string;
  password?: string; // Added for email/password login
  permissions?: {
    viewSales: boolean;
    viewProducts: boolean;
    viewReports: boolean;
    managePurchases: boolean;
    manageExpenses: boolean;
  };
}

// Shop Types
export interface Shop {
  id: string;
  name: string;
  location?: string;
  logo?: string;
  currency: string;
  ownerId: string;
  createdAt: string;
  taxId?: string; // Added this property
  address?: string; // Added this property
  receiptMessage?: string; // Added this property
}

// Product Types
export interface Product {
  id: string;
  name: string;
  barcode?: string;
  description?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  category?: string;
  shopId: string;
  imageUrl?: string;
  isActive: boolean;
}

// Sales Types
export interface CartItem {
  product: Product;
  quantity: number;
  discount?: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  shopId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  total: number;
  paymentMethod: "cash" | "mpesa" | "card" | "credit";
  customerId?: string;
  cashierId: string;
  timestamp: string;
  receiptNumber: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints?: number;
  shopId: string;
}

// Expense Types
export interface Expense {
  id: string;
  shopId: string;
  amount: number;
  category: string;
  description?: string;
  timestamp: string;
  addedBy: string;
}

// Purchase Types
export interface Purchase {
  id: string;
  shopId: string;
  supplierId?: string;
  items: PurchaseItem[];
  total: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  paymentMethod?: "cash" | "mpesa" | "bank" | "credit";
  amountPaid: number;
  balance: number;
  reference?: string;
  timestamp: string;
  addedBy: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  shopId: string;
}

// For Analytics and Reports
export interface DailySales {
  date: string;
  totalSales: number;
  totalItems: number;
  transactions: number;
}

export type TimeRange = "today" | "yesterday" | "week" | "month" | "custom";

