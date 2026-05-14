import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, BarChart2, Quote, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sideItems = [
    { name: t('dashboard'), path: '/', icon: Home, end: true },
    { name: t('products'), path: '/products', icon: Package, end: false },
    // center action sits here
    { name: t('quotations'), path: '/quotations', icon: Quote, end: false },
    { name: t('reports'), path: '/reports', icon: BarChart2, end: false },
  ];

  const isPosActive = pathname.startsWith('/pos');

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-[0_-4px_16px_rgba(15,27,61,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative grid grid-cols-5 items-end h-16">
        {sideItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )
              }
            >
              <Icon size={20} />
              <span className="truncate max-w-[60px]">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Centered FAB-style Sell button */}
        <div className="flex items-start justify-center">
          <button
            type="button"
            onClick={() => navigate('/pos')}
            aria-label="New Sale"
            className={cn(
              '-mt-6 h-14 w-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95',
              'bg-primary text-primary-foreground hover:brightness-110',
              isPosActive && 'ring-4 ring-primary/25'
            )}
          >
            <ShoppingCart size={22} />
            <span className="text-[9px] font-semibold mt-0.5">Sell</span>
          </button>
        </div>

        {sideItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )
              }
            >
              <Icon size={20} />
              <span className="truncate max-w-[60px]">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
