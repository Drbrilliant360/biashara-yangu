
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
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="expenses" element={<ExpensesPage />} />
                    <Route path="purchases" element={<PurchasesPage />} />
                    <Route path="sales" element={<SalesPage />} />
                    <Route path="customers" element={<UsersPage />} />
                    <Route path="quotations" element={<QuotationsPage />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BillingReminderWrapper>
            </ShopProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
