
import React, { useState } from 'react';
import { Menu, Bell, User } from 'lucide-react';
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

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentShop } = useShop();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-2 px-4">
      <div className="flex items-center justify-between h-12">
        {/* Left side - Mobile menu button or shop name */}
        <div className="flex items-center">
          {isMobile ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </Button>
              <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            </>
          ) : (
            <div className="flex items-center">
              <span className="font-medium text-biashara-dark">
                {currentShop?.name || "No Shop Selected"}
              </span>
            </div>
          )}
        </div>
        
        {/* Right side - User profile and notifications */}
        <div className="flex items-center gap-2">
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
                {user?.name || "User"}
                <p className="text-xs text-muted-foreground font-normal mt-1">
                  {user?.role || "Role"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => window.location.href = '/profile'}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => window.location.href = '/settings'}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={logout} className="text-red-500">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
