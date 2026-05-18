import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Package, BarChart2, CreditCard, Settings, Users, X, Store,
  FileMinus, FileText, Quote, Sparkles, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ShopSwitcher } from '@/components/shop/ShopSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

type NavItem = { name: string; path: string; icon: React.ReactNode };
type NavGroup = { label: string; items: NavItem[] };

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
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
        { name: t('customers'), path: '/customers', icon: <Users size={18} /> },
        { name: t('shops'), path: '/shops', icon: <Store size={18} /> },
        { name: t('settings'), path: '/settings', icon: <Settings size={18} /> },
        ...(isSuperAdmin ? [{ name: 'Super Admin', path: '/admin', icon: <Shield size={18} /> }] : []),
      ],
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative h-full w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground flex flex-col animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between p-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Biashara Yangu logo" className="w-9 h-9 rounded-md bg-white object-contain p-1" />
            <h1 className="text-lg font-bold tracking-tight text-white">Biashara Yangu</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <X size={20} />
          </Button>
        </div>

        <div className="px-4 mb-3 flex-shrink-0">
          <p className="text-sm font-medium truncate text-white">{user?.name}</p>
          <p className="text-xs text-sidebar-foreground/60">{user?.role}</p>
        </div>

        <div className="px-3 mb-4 flex-shrink-0">
          <ShopSwitcher />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-4">
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
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-primary/15 text-white border-l-2 border-sidebar-primary pl-[10px]'
                            : 'text-sidebar-foreground/75 hover:bg-white/5 hover:text-white'
                        )
                      }
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border/60">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-destructive/15"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            {t('logout')}
          </Button>
        </div>
      </aside>
    </div>
  );
};
