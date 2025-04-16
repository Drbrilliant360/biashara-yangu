
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ShopsPage from "@/pages/shops/ShopsPage";
import AddShopPage from "@/pages/shops/AddShopPage";
import ProductsPage from "@/pages/products/ProductsPage";
import AddProductPage from "@/pages/products/AddProductPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import POSPage from "@/pages/pos/POSPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import NotFound from "@/pages/NotFound";
import ExpensesPage from "@/pages/expenses/ExpensesPage";
import PurchasesPage from "@/pages/purchases/PurchasesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ShopProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="shops" element={<ShopsPage />} />
                <Route path="shops/add" element={<AddShopPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/add" element={<AddProductPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="pos" element={<POSPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="purchases" element={<PurchasesPage />} />
                
                {/* These routes will be implemented later */}
                <Route path="sales" element={<DashboardPage />} />
                <Route path="customers" element={<DashboardPage />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ShopProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
