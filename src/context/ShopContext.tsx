
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { Shop } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

type CreateShopInput = Omit<Shop, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'is_active'>;

interface ShopContextType {
  currentShop: Shop | null;
  shops: Shop[];
  addShop: (shop: CreateShopInput) => Promise<boolean>;
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

  const normalizeShop = (shop: Partial<Shop> & {
    ownerId?: string;
    createdAt?: string;
    updatedAt?: string;
    isActive?: boolean;
  }): Shop => {
    const now = new Date().toISOString();

    return {
      id: shop.id || `shop_${Date.now()}`,
      owner_id: shop.owner_id || shop.ownerId || '',
      name: shop.name || 'Untitled Shop',
      location: shop.location,
      phone: shop.phone,
      email: shop.email,
      currency: shop.currency || 'KES',
      logo_url: shop.logo_url,
      is_active: shop.is_active ?? shop.isActive ?? true,
      created_at: shop.created_at || shop.createdAt || now,
      updated_at: shop.updated_at || shop.updatedAt || shop.created_at || shop.createdAt || now,
    };
  };

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
      const allShops = getItem<Array<Partial<Shop> & { ownerId?: string; createdAt?: string; updatedAt?: string; isActive?: boolean }>>(STORAGE_KEYS.SHOPS, [])
        .map(normalizeShop);
      
      // Filter shops for the current user
      const userShops = user ? allShops.filter(shop => 
        shop.owner_id === user.id || user.shops.includes(shop.id)
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

  const addShop = async (newShop: CreateShopInput): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a shop.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const allShops = getItem<Array<Partial<Shop> & { ownerId?: string; createdAt?: string; updatedAt?: string; isActive?: boolean }>>(STORAGE_KEYS.SHOPS, [])
        .map(normalizeShop);
      const now = new Date().toISOString();

      const shop = normalizeShop({
        ...newShop,
        id: `shop_${Date.now()}`,
        owner_id: user.id,
        created_at: now,
        updated_at: now,
        is_active: true,
      });
      
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
