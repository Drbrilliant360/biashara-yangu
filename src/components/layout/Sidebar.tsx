
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, BarChart2, CreditCard, Settings, Users, LogOut, Store, FileMinus, FileText, Quote, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import { cn } from '@/lib/utils';
import { ShopSwitcher } from '@/components/shop/ShopSwitcher';
import { useLanguage } from '@/context/LanguageContext';

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const { currentShop } = useShop();
  const { t } = useLanguage();
  
  const navItems = [
    { name: t("dashboard"), path: "/", icon: <Home size={20} /> },
    { name: "Mauzo AI", path: "/mauzo-ai", icon: <Sparkles size={20} /> },
    { name: t("quotations"), path: "/quotations", icon: <Quote size={20} /> },
    { name: t("products"), path: "/products", icon: <Package size={20} /> },
    { name: t("sales"), path: "/sales", icon: <CreditCard size={20} /> },
    { name: t("purchases"), path: "/purchases", icon: <FileText size={20} /> },
    { name: t("expenses"), path: "/expenses", icon: <FileMinus size={20} /> },
    { name: t("reports"), path: "/reports", icon: <BarChart2 size={20} /> },
    { name: t("users"), path: "/customers", icon: <Users size={20} /> },
    { name: t("shops"), path: "/shops", icon: <Store size={20} /> },
    { name: t("settings"), path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside className="h-full bg-biashara-dark text-white flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold text-white">Biashara Yangu</h1>
        <div className="text-xs text-gray-400 mt-1">{t("business management system")}</div>
      </div>
      <div className="px-4 mb-6">
        <ShopSwitcher />
      </div>
      <nav className="flex-1">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
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
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 rounded-md hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          <span>{t("logout")}</span>
        </button>
      </div>
    </aside>
  );
};
