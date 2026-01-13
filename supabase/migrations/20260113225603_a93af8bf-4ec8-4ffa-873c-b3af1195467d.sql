-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'cashier', 'user')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shops table
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  email TEXT,
  currency TEXT NOT NULL DEFAULT 'KES',
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop_users table for multi-user access
CREATE TABLE public.shop_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'manager', 'cashier')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, user_id)
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  description TEXT,
  buying_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  unit TEXT DEFAULT 'piece',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  receipt_number TEXT,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'card', 'credit')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchases table (for restocking)
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  supplier_name TEXT,
  supplier_phone TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  notes TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_items table
CREATE TABLE public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotations table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  quotation_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotation_items table
CREATE TABLE public.quotation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shops policies
CREATE POLICY "Users can view shops they own or work at" ON public.shops FOR SELECT 
  USING (owner_id = auth.uid() OR id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Owners can create shops" ON public.shops FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update their shops" ON public.shops FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete their shops" ON public.shops FOR DELETE USING (owner_id = auth.uid());

-- Shop users policies
CREATE POLICY "Shop owners and users can view shop_users" ON public.shop_users FOR SELECT 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Shop owners can manage shop_users" ON public.shop_users FOR INSERT 
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "Shop owners can update shop_users" ON public.shop_users FOR UPDATE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "Shop owners can delete shop_users" ON public.shop_users FOR DELETE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Products policies
CREATE POLICY "Shop users can view products" ON public.products FOR SELECT 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) 
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Shop owners and managers can create products" ON public.products FOR INSERT 
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_active = true));
CREATE POLICY "Shop owners and managers can update products" ON public.products FOR UPDATE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_active = true));
CREATE POLICY "Shop owners can delete products" ON public.products FOR DELETE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Sales policies
CREATE POLICY "Shop users can view sales" ON public.sales FOR SELECT 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) 
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Shop users can create sales" ON public.sales FOR INSERT 
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Shop owners can update sales" ON public.sales FOR UPDATE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "Shop owners can delete sales" ON public.sales FOR DELETE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Sale items policies
CREATE POLICY "Users can view sale items for accessible sales" ON public.sale_items FOR SELECT 
  USING (sale_id IN (SELECT id FROM public.sales WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) 
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "Users can create sale items" ON public.sale_items FOR INSERT 
  WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true)));

-- Expenses policies
CREATE POLICY "Shop users can view expenses" ON public.expenses FOR SELECT 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) 
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Shop owners and managers can create expenses" ON public.expenses FOR INSERT 
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_active = true));
CREATE POLICY "Shop owners and managers can update expenses" ON public.expenses FOR UPDATE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_active = true));
CREATE POLICY "Shop owners can delete expenses" ON public.expenses FOR DELETE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Purchases policies
CREATE POLICY "Shop users can view purchases" ON public.purchases FOR SELECT 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) 
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Shop owners and managers can create purchases" ON public.purchases FOR INSERT 
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_active = true));
CREATE POLICY "Shop owners and managers can update purchases" ON public.purchases FOR UPDATE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_active = true));
CREATE POLICY "Shop owners can delete purchases" ON public.purchases FOR DELETE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Purchase items policies
CREATE POLICY "Users can view purchase items" ON public.purchase_items FOR SELECT 
  USING (purchase_id IN (SELECT id FROM public.purchases WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) 
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "Users can create purchase items" ON public.purchase_items FOR INSERT 
  WITH CHECK (purchase_id IN (SELECT id FROM public.purchases WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_active = true)));

-- Quotations policies
CREATE POLICY "Shop users can view quotations" ON public.quotations FOR SELECT 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) 
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Shop users can create quotations" ON public.quotations FOR INSERT 
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Shop users can update quotations" ON public.quotations FOR UPDATE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Shop owners can delete quotations" ON public.quotations FOR DELETE 
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Quotation items policies
CREATE POLICY "Users can view quotation items" ON public.quotation_items FOR SELECT 
  USING (quotation_id IN (SELECT id FROM public.quotations WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) 
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "Users can create quotation items" ON public.quotation_items FOR INSERT 
  WITH CHECK (quotation_id IN (SELECT id FROM public.quotations WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR shop_id IN (SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid() AND is_active = true)));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update stock after sale
CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for stock update on sale
CREATE TRIGGER on_sale_item_created
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_sale();

-- Create function to update stock after purchase
CREATE OR REPLACE FUNCTION public.update_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products 
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for stock update on purchase
CREATE TRIGGER on_purchase_item_created
  AFTER INSERT ON public.purchase_items
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_purchase();

-- Create indexes for performance
CREATE INDEX idx_products_shop_id ON public.products(shop_id);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_sales_shop_id ON public.sales(shop_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_expenses_shop_id ON public.expenses(shop_id);
CREATE INDEX idx_purchases_shop_id ON public.purchases(shop_id);
CREATE INDEX idx_quotations_shop_id ON public.quotations(shop_id);
CREATE INDEX idx_shop_users_user_id ON public.shop_users(user_id);
CREATE INDEX idx_shop_users_shop_id ON public.shop_users(shop_id);