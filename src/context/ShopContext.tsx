
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { Shop } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

interface ShopContextType {
  currentShop: Shop | null;
  shops: Shop[];
  addShop: (shop: Omit<Shop, 'id' | 'createdAt'>) => Promise<boolean>;
  updateShop: (shop: Shop) => Promise<boolean>;
  deleteShop: (shopId: string) => Promise<boolean>;
  switchShop: (shopId: string) => void;
  loading: boolean;
}

const ShopContext = createContext<ShopContextType>({
  currentShop: null,
  shops: [],
  addShop: async () => false,
  updateShop: async () => false,
  deleteShop: async () => false,
  switchShop: () => {},
  loading: true,
});

export const useShop = () => useContext(ShopContext);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadShops();
    } else {
      setShops([]);
      setCurrentShop(null);
      setLoading(false);
    }
  }, [user]);

  const loadShops = () => {
    try {
      // Get all shops
      const allShops = getItem<Shop[]>(STORAGE_KEYS.SHOPS, []);
      
      // Filter shops for the current user
      const userShops = user ? allShops.filter(shop => 
        shop.ownerId === user.id || user.shops.includes(shop.id)
      ) : [];
      
      setShops(userShops);
      
      // Try to load the last selected shop
      const savedShopId = getItem<string | null>(STORAGE_KEYS.CURRENT_SHOP, null);
      
      if (savedShopId) {
        const shopToLoad = userShops.find(s => s.id === savedShopId);
        if (shopToLoad) {
          setCurrentShop(shopToLoad);
        } else if (userShops.length > 0) {
          // If last shop is not found, use first available shop
          setCurrentShop(userShops[0]);
          setItem(STORAGE_KEYS.CURRENT_SHOP, userShops[0].id);
        }
      } else if (userShops.length > 0) {
        // No saved shop, use first available shop
        setCurrentShop(userShops[0]);
        setItem(STORAGE_KEYS.CURRENT_SHOP, userShops[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading shops:', error);
      toast({
        title: "Error",
        description: "Failed to load your shops.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const addShop = async (newShop: Omit<Shop, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a shop.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const allShops = getItem<Shop[]>(STORAGE_KEYS.SHOPS, []);
      
      const shop: Shop = {
        ...newShop,
        id: `shop_${Date.now()}`,
        ownerId: user.id,
        createdAt: new Date().toISOString()
      };
      
      const updatedShops = [...allShops, shop];
      setItem(STORAGE_KEYS.SHOPS, updatedShops);
      
      // Update local state
      setShops(prev => [...prev, shop]);
      
      // If this is the first shop, set it as current
      if (!currentShop) {
        setCurrentShop(shop);
        setItem(STORAGE_KEYS.CURRENT_SHOP, shop.id);
      }
      
      toast({
        title: "Success",
        description: `Shop "${shop.name}" has been added.`,
      });
      
      return true;
    } catch (error) {
      console.error('Error adding shop:', error);
      toast({
        title: "Error",
        description: "Failed to add shop.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateShop = async (updatedShop: Shop): Promise<boolean> => {
    try {
      const allShops = getItem<Shop[]>(STORAGE_KEYS.SHOPS, []);
      
      const updatedShops = allShops.map(shop => 
        shop.id === updatedShop.id ? updatedShop : shop
      );
      
      setItem(STORAGE_KEYS.SHOPS, updatedShops);
      
      // Update local state
      setShops(prev => prev.map(shop => 
        shop.id === updatedShop.id ? updatedShop : shop
      ));
      
      // If current shop was updated, update that too
      if (currentShop && currentShop.id === updatedShop.id) {
        setCurrentShop(updatedShop);
      }
      
      toast({
        title: "Success",
        description: `Shop "${updatedShop.name}" has been updated.`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating shop:', error);
      toast({
        title: "Error",
        description: "Failed to update shop.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteShop = async (shopId: string): Promise<boolean> => {
    try {
      const allShops = getItem<Shop[]>(STORAGE_KEYS.SHOPS, []);
      
      const updatedShops = allShops.filter(shop => shop.id !== shopId);
      setItem(STORAGE_KEYS.SHOPS, updatedShops);
      
      // Update local state
      const newShopsList = shops.filter(shop => shop.id !== shopId);
      setShops(newShopsList);
      
      // If current shop was deleted, switch to another shop
      if (currentShop && currentShop.id === shopId) {
        if (newShopsList.length > 0) {
          setCurrentShop(newShopsList[0]);
          setItem(STORAGE_KEYS.CURRENT_SHOP, newShopsList[0].id);
        } else {
          setCurrentShop(null);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_SHOP);
        }
      }
      
      toast({
        title: "Success",
        description: "Shop has been deleted.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast({
        title: "Error",
        description: "Failed to delete shop.",
        variant: "destructive",
      });
      return false;
    }
  };

  const switchShop = (shopId: string) => {
    const shop = shops.find(s => s.id === shopId);
    
    if (shop) {
      setCurrentShop(shop);
      setItem(STORAGE_KEYS.CURRENT_SHOP, shopId);
      toast({
        title: "Shop Switched",
        description: `Now using "${shop.name}"`,
      });
    }
  };

  return (
    <ShopContext.Provider value={{ 
      currentShop,
      shops,
      addShop,
      updateShop,
      deleteShop,
      switchShop,
      loading
    }}>
      {children}
    </ShopContext.Provider>
  );
};
