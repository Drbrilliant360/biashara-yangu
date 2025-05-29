
// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;  // Required for email/password login
  pin?: string;      // Made optional as we're moving to password
  role: "owner" | "manager" | "cashier";
  shops: string[]; // shop IDs the user has access to
  phone?: string;
  profilePicture?: string; // URL to profile image
  securityQuestion?: string; // Security question text
  securityAnswer?: string; // Answer to security question
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
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  receiptMessage?: string;
}

// Product Types - Updated to match database schema
export interface Product {
  id: string;
  name: string;
  part_number?: string;
  description?: string;
  brand?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Quotation Types
export interface Quotation {
  id: string;
  user_id: string;
  client_name: string;
  client_location?: string;
  reference_number?: string;
  quotation_date: string;
  total_amount: number;
  vat_amount: number;
  grand_total: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  part_number: string;
  description?: string;
  brand?: string;
  quantity: number;
  rate: number;
  amount: number;
  vat_percentage: number;
  vat_amount: number;
  total_amount: number;
  created_at: string;
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
  user_id: string;
  total: number;
  payment_method: string;
  customer_name?: string;
  receipt_number?: string;
  created_at: string;
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
  user_id: string;
  amount: number;
  category: string;
  description?: string;
  created_at: string;
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
