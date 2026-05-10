
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { LanguageProvider } from "@/context/LanguageContext";

// Pages
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ShopsPage from "@/pages/shops/ShopsPage";
import AddShopPage from "@/pages/shops/AddShopPage";
import ProductsPage from "@/pages/products/ProductsPage";
import AddProductPage from "@/pages/products/AddProductPage";
import EditProductPage from "@/pages/products/EditProductPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import NotFound from "@/pages/NotFound";
import ExpensesPage from "@/pages/expenses/ExpensesPage";
import PurchasesPage from "@/pages/purchases/PurchasesPage";
import SalesPage from "@/pages/sales/SalesPage";
import UsersPage from "@/pages/users/UsersPage";
import QuotationsPage from "@/pages/quotations/QuotationsPage";
import MauzoAIPage from "@/pages/ai/MauzoAIPage";
import AdminOverviewPage from "@/pages/admin/AdminOverviewPage";
import AdminShopsPage from "@/pages/admin/AdminShopsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminSubscriptionsPage from "@/pages/admin/AdminSubscriptionsPage";
import AdminRevenuePage from "@/pages/admin/AdminRevenuePage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminSalesPage from "@/pages/admin/AdminSalesPage";
import { RequireSuperAdmin } from "@/components/admin/RequireSuperAdmin";

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <ShopProvider>
              <>
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
                    <Route path="products/edit/:id" element={<EditProductPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="expenses" element={<ExpensesPage />} />
                    <Route path="purchases" element={<PurchasesPage />} />
                    <Route path="sales" element={<SalesPage />} />
                    <Route path="customers" element={<UsersPage />} />
                    <Route path="quotations" element={<QuotationsPage />} />
                    <Route path="mauzo-ai" element={<MauzoAIPage />} />
                    <Route path="admin" element={<RequireSuperAdmin><AdminOverviewPage /></RequireSuperAdmin>} />
                    <Route path="admin/shops" element={<RequireSuperAdmin><AdminShopsPage /></RequireSuperAdmin>} />
                    <Route path="admin/users" element={<RequireSuperAdmin><AdminUsersPage /></RequireSuperAdmin>} />
                    <Route path="admin/subscriptions" element={<RequireSuperAdmin><AdminSubscriptionsPage /></RequireSuperAdmin>} />
                    <Route path="admin/revenue" element={<RequireSuperAdmin><AdminRevenuePage /></RequireSuperAdmin>} />
                    <Route path="admin/products" element={<RequireSuperAdmin><AdminProductsPage /></RequireSuperAdmin>} />
                    <Route path="admin/sales" element={<RequireSuperAdmin><AdminSalesPage /></RequireSuperAdmin>} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </>
            </ShopProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
