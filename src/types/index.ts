
// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  pin?: string;
  role: "owner" | "manager" | "cashier" | "user";
  shops: string[];
  phone?: string;
  profilePicture?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  permissions?: {
    viewSales: boolean;
    viewProducts: boolean;
    viewReports: boolean;
    managePurchases: boolean;
    manageExpenses: boolean;
  };
}

// Profile (from database)
export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Shop Types
export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  location?: string;
  phone?: string;
  email?: string;
  currency: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Types - Updated to match database schema
export interface Product {
  id: string;
  shop_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  description?: string;
  buying_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  unit?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  shop_id: string;
  user_id: string;
  receipt_number?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: string;
}

// Expense Types
export interface Expense {
  id: string;
  shop_id: string;
  user_id: string;
  category: string;
  description?: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

// Purchase Types
export interface Purchase {
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
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

// Quotation Types
export interface Quotation {
  id: string;
  shop_id: string;
  user_id: string;
  quotation_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints?: number;
  shop_id: string;
}

// Shop Users (for multi-user shops)
export interface ShopUser {
  id: string;
  shop_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  shop_id: string;
}

// For Analytics and Reports
export interface DailySales {
  date: string;
  totalSales: number;
  totalItems: number;
  transactions: number;
}

export type TimeRange = "today" | "yesterday" | "week" | "month" | "custom";
