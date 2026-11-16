
import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { LanguageProvider } from "@/context/LanguageContext";
import ScrollToTop from "@/components/ScrollToTop";

// Pages (lazy-loaded so the first screen on mobile downloads far less JavaScript)
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ShopsPage = lazy(() => import("@/pages/shops/ShopsPage"));
const AddShopPage = lazy(() => import("@/pages/shops/AddShopPage"));
const ProductsPage = lazy(() => import("@/pages/products/ProductsPage"));
const AddProductPage = lazy(() => import("@/pages/products/AddProductPage"));
const EditProductPage = lazy(() => import("@/pages/products/EditProductPage"));
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ExpensesPage = lazy(() => import("@/pages/expenses/ExpensesPage"));
const PurchasesPage = lazy(() => import("@/pages/purchases/PurchasesPage"));
const SalesPage = lazy(() => import("@/pages/sales/SalesPage"));
const UsersPage = lazy(() => import("@/pages/users/UsersPage"));
const QuotationsPage = lazy(() => import("@/pages/quotations/QuotationsPage"));
const MauzoAIPage = lazy(() => import("@/pages/ai/MauzoAIPage"));
const AdminOverviewPage = lazy(() => import("@/pages/admin/AdminOverviewPage"));
const AdminShopsPage = lazy(() => import("@/pages/admin/AdminShopsPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminSubscriptionsPage = lazy(() => import("@/pages/admin/AdminSubscriptionsPage"));
const AdminRevenuePage = lazy(() => import("@/pages/admin/AdminRevenuePage"));
const AdminProductsPage = lazy(() => import("@/pages/admin/AdminProductsPage"));
const AdminSalesPage = lazy(() => import("@/pages/admin/AdminSalesPage"));
const AdminSupportPage = lazy(() => import("@/pages/admin/AdminSupportPage"));
const HelpPage = lazy(() => import("@/pages/support/HelpPage"));
import { RequireSuperAdmin } from "@/components/admin/RequireSuperAdmin";
const InvoiceGeneratorPage = lazy(() => import("@/pages/invoice/InvoiceGeneratorPage"));
const TermsPage = lazy(() => import("@/pages/legal/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/legal/PrivacyPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>
);

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
                <ScrollToTop />
                <Toaster />
                <Sonner />
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/invoice-generator" element={<InvoiceGeneratorPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  
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
                    <Route path="help" element={<HelpPage />} />
                    <Route path="admin" element={<RequireSuperAdmin><AdminOverviewPage /></RequireSuperAdmin>} />
                    <Route path="admin/shops" element={<RequireSuperAdmin><AdminShopsPage /></RequireSuperAdmin>} />
                    <Route path="admin/users" element={<RequireSuperAdmin><AdminUsersPage /></RequireSuperAdmin>} />
                    <Route path="admin/subscriptions" element={<RequireSuperAdmin><AdminSubscriptionsPage /></RequireSuperAdmin>} />
                    <Route path="admin/revenue" element={<RequireSuperAdmin><AdminRevenuePage /></RequireSuperAdmin>} />
                    <Route path="admin/products" element={<RequireSuperAdmin><AdminProductsPage /></RequireSuperAdmin>} />
                    <Route path="admin/sales" element={<RequireSuperAdmin><AdminSalesPage /></RequireSuperAdmin>} />
                    <Route path="admin/support" element={<RequireSuperAdmin><AdminSupportPage /></RequireSuperAdmin>} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </>
            </ShopProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
