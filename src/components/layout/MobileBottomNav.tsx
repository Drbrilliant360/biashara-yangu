import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, BarChart2, Sparkles, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();

  const items = [
    { name: t('dashboard'), path: '/', icon: Home },
    { name: t('products'), path: '/products', icon: Package },
    { name: 'AI', path: '/mauzo-ai', icon: Sparkles },
    { name: t('quotations'), path: '/quotations', icon: Quote },
    { name: t('reports'), path: '/reports', icon: BarChart2 },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                    isActive
                      ? 'text-biashara-primary'
                      : 'text-gray-500 hover:text-biashara-primary'
                  )
                }
              >
                <Icon size={20} />
                <span className="truncate max-w-[60px]">{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
