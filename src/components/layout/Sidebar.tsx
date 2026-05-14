import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Package, BarChart2, CreditCard, Settings, Users, LogOut, Store,
  FileMinus, FileText, Quote, Sparkles, Shield, ShoppingCart
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ShopSwitcher } from '@/components/shop/ShopSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';

type NavItem = { name: string; path: string; icon: React.ReactNode };
type NavGroup = { label: string; items: NavItem[] };

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const { isSuperAdmin } = useUserRole();

  const groups: NavGroup[] = [
    {
      label: t('overview') || 'Overview',
      items: [
        { name: t('dashboard'), path: '/', icon: <Home size={18} /> },
        { name: 'Mauzo AI', path: '/mauzo-ai', icon: <Sparkles size={18} /> },
      ],
    },
    {
      label: t('sales') || 'Sales',
      items: [
        { name: 'POS', path: '/pos', icon: <ShoppingCart size={18} /> },
        { name: t('sales'), path: '/sales', icon: <CreditCard size={18} /> },
        { name: t('quotations'), path: '/quotations', icon: <Quote size={18} /> },
      ],
    },
    {
      label: t('inventory') || 'Inventory',
      items: [
        { name: t('products'), path: '/products', icon: <Package size={18} /> },
        { name: t('purchases'), path: '/purchases', icon: <FileText size={18} /> },
        { name: t('expenses'), path: '/expenses', icon: <FileMinus size={18} /> },
      ],
    },
    {
      label: t('insights') || 'Insights',
      items: [
        { name: t('reports'), path: '/reports', icon: <BarChart2 size={18} /> },
      ],
    },
    {
      label: t('manage') || 'Manage',
      items: [
        { name: t('users'), path: '/customers', icon: <Users size={18} /> },
        { name: t('shops'), path: '/shops', icon: <Store size={18} /> },
        { name: t('settings'), path: '/settings', icon: <Settings size={18} /> },
        ...(isSuperAdmin ? [{ name: 'Super Admin', path: '/admin', icon: <Shield size={18} /> }] : []),
      ],
    },
  ];

  return (
    <aside className="h-full bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-4 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-white">Biashara Yangu</h1>
        <div className="text-[11px] text-sidebar-foreground/60 mt-0.5">
          {t('business management system')}
        </div>
      </div>

      <div className="px-3 mb-4">
        <ShopSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-primary/15 text-white border-l-2 border-sidebar-primary pl-[10px]'
                          : 'text-sidebar-foreground/75 hover:bg-white/5 hover:text-white'
                      )
                    }
                  >
                    {item.icon}
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border/60">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-sidebar-foreground/75 rounded-md hover:bg-destructive/15 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
};
