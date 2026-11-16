
import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast as sonnerToast } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { LanguageProvider } from "@/context/LanguageContext";
import ScrollToTop from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { ConfirmProvider } from "@/components/feedback/ConfirmDialog";
import { TopProgressBar } from "@/components/feedback/TopProgressBar";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import { friendlyError } from "@/lib/errors";

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
const AdminAuditPage = lazy(() => import("@/pages/admin/AdminAuditPage"));
const HelpPage = lazy(() => import("@/pages/support/HelpPage"));
import { RequireSuperAdmin } from "@/components/admin/RequireSuperAdmin";
const InvoiceGeneratorPage = lazy(() => import("@/pages/invoice/InvoiceGeneratorPage"));
const TermsPage = lazy(() => import("@/pages/legal/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/legal/PrivacyPage"));

const PageLoader = () => <LoadingState className="h-screen" />;

// Create a client
// Any failed query/mutation shows a clear message (individual screens can still handle their own).
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => sonnerToast.error(friendlyError(error, 'Could not load data. Pull to refresh or try again.')),
  }),
  mutationCache: new MutationCache({
    onError: (error) => sonnerToast.error(friendlyError(error)),
  }),
  defaultOptions: {
    queries: {
      // Retry transient failures (network, 5xx) with exponential backoff + jitter; never retry 4xx
      // (bad request, no permission, expired session): repeating those cannot succeed.
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(8000, 1000 * 2 ** attempt) * (0.5 + Math.random() / 2),
      refetchOnWindowFocus: false,
    },
    // Mutations are never retried automatically: a retried "create sale" could double-record.
    mutations: { retry: false },
  },
});

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <BrowserRouter>
          <ConfirmProvider>
          <AuthProvider>
            <ShopProvider>
              <>
                <ScrollToTop />
                <Toaster />
                <Sonner />
                <TopProgressBar />
                <OfflineBanner />
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
                    <Route path="admin/audit" element={<RequireSuperAdmin><AdminAuditPage /></RequireSuperAdmin>} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </>
            </ShopProvider>
          </AuthProvider>
          </ConfirmProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
