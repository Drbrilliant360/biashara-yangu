
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, Globe, Plus, ShoppingCart, Package, FileMinus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileSidebar } from './MobileSidebar';
import { useLanguage } from '@/context/LanguageContext';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentShop } = useShop();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-2 px-4">
      <div className="flex items-center justify-between h-12">
        {/* Left side - Mobile menu button + shop name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isMobile && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="flex-shrink-0"
              >
                <Menu size={24} />
              </Button>
              <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            </>
          )}
          <span className="font-medium text-biashara-dark truncate text-sm sm:text-base">
            {currentShop?.name || t("no shop selected")}
          </span>
        </div>
        
        {/* Right side - Language, Notification, and User profile */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("change language")} className="rounded-full">
                <Globe size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("change language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setLanguage('english')}
                className={language === 'english' ? 'font-semibold bg-accent/10' : ''}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setLanguage('swahili')}
                className={language === 'swahili' ? 'font-semibold bg-accent/10' : ''}
              >
                Kiswahili
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Notification bell */}
          <Button variant="ghost" size="icon">
            <Bell size={20} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.name || t("user")}
                <p className="text-xs text-muted-foreground font-normal mt-1">
                  {user?.role || t("role")}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => window.location.href = '/profile'}>
                {t("profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => window.location.href = '/settings'}>
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={logout} className="text-red-500">
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
