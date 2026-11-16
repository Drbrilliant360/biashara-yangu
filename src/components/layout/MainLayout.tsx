
import React, { lazy, Suspense } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { isNative } from '@/lib/platform';
import { PageSkeleton } from '@/components/feedback/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));

export const MainLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // If still checking authentication status, show loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-biashara-primary font-semibold">Loading...</div>
      </div>
    );
  }

  // Signed-out visitors on the web see the marketing landing page at "/".
  // The native apps (Android/iOS) go straight to sign-in.
  if (!isAuthenticated) {
    if (location.pathname === '/' && !isNative()) {
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>}>
          <LandingPage />
        </Suspense>
      );
    }
    return <Navigate to="/login" />;
  }
  
  // Main application layout
  return (
    <div className="flex h-[calc(100dvh-env(safe-area-inset-top))] bg-biashara-background overflow-hidden">
      {/* Sidebar - hidden on mobile, shown on desktop */}
      {!isMobile && (
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Main scrollable content */}
        <main
          className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6"
          style={isMobile ? { paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' } : undefined}
        >
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};
