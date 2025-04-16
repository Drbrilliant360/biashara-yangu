
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useIsMobile } from '@/hooks/use-mobile';

export const MainLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const isMobile = useIsMobile();
  
  // If still checking authentication status, show loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-biashara-primary font-semibold">Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Main application layout
  return (
    <div className="flex h-screen bg-biashara-background overflow-hidden">
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
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
