
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart, BarChart2, CreditCard, Settings, Users, X, Store, FileMinus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ShopSwitcher } from '@/components/shop/ShopSwitcher';
import { useLanguage } from '@/context/LanguageContext';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  
  const navItems = [
    { name: t("dashboard"), path: "/", icon: <Home size={20} /> },
    { name: t("pos"), path: "/pos", icon: <ShoppingCart size={20} /> },
    { name: t("products"), path: "/products", icon: <Package size={20} /> },
    { name: t("sales"), path: "/sales", icon: <CreditCard size={20} /> },
    { name: t("purchases"), path: "/purchases", icon: <FileText size={20} /> },
    { name: t("expenses"), path: "/expenses", icon: <FileMinus size={20} /> },
    { name: t("reports"), path: "/reports", icon: <BarChart2 size={20} /> },
    { name: t("customers"), path: "/customers", icon: <Users size={20} /> },
    { name: t("shops"), path: "/shops", icon: <Store size={20} /> },
    { name: t("settings"), path: "/settings", icon: <Settings size={20} /> },
  ];

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-biashara-dark text-white flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Biashara Yangu</h1>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X size={20} />
          </Button>
        </div>
        
        {/* User info */}
        <div className="px-4 mb-4">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>

        {/* Shop switcher */}
        <div className="px-4 mb-6">
          <ShopSwitcher />
        </div>
        
        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-biashara-primary/10",
                    isActive ? "bg-biashara-primary text-white" : "text-gray-300"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            {t("logout")}
          </Button>
        </div>
      </aside>
    </div>
  );
};
