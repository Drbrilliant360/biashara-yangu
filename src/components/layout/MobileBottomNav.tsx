import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, BarChart2, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();

  const items = [
    { name: t('dashboard'), path: '/', icon: Home, end: true },
    { name: t('products'), path: '/products', icon: Package, end: false },
    { name: t('quotations'), path: '/quotations', icon: Quote, end: false },
    { name: t('reports'), path: '/reports', icon: BarChart2, end: false },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-[0_-4px_16px_rgba(15,27,61,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                )
              }
            >
              <Icon size={20} />
              <span className="truncate max-w-[70px]">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
