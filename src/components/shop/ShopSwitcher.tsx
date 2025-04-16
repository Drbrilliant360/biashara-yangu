
import React from 'react';
import { Store, ChevronDown } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';

export const ShopSwitcher: React.FC = () => {
  const { currentShop, shops, switchShop } = useShop();
  const navigate = useNavigate();
  
  // Handle the case where there are no shops yet
  if (!currentShop && shops.length === 0) {
    return (
      <Button 
        variant="outline" 
        className="w-full justify-between text-left font-normal border-biashara-primary/50 text-biashara-primary"
        onClick={() => navigate('/shops/add')}
      >
        <span className="truncate">Add your first shop</span>
        <Store size={16} />
      </Button>
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between text-left font-normal bg-biashara-primary/10 border-biashara-primary/50"
        >
          <span className="truncate">{currentShop?.name || "Select Shop"}</span>
          <ChevronDown size={16} className="ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Switch Shop</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {shops.map((shop) => (
          <DropdownMenuItem 
            key={shop.id}
            onClick={() => switchShop(shop.id)}
            className={
              currentShop?.id === shop.id 
                ? "bg-biashara-primary text-white" 
                : ""
            }
          >
            <Store className="mr-2 h-4 w-4" />
            <span className="truncate">{shop.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/shops/add')}>
          <span className="text-biashara-primary">+ Add New Shop</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
