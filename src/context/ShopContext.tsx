
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shop } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      loadShops();
    } else {
      setShops([]);
      setCurrentShop(null);
      setLoading(false);
    }
  }, [user]);

  const loadShops = async () => {
    try {
      if (!user) { setShops([]); setCurrentShop(null); setLoading(false); return; }
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });



      if (error) throw error;

      const userShops = (data || []) as Shop[];
      setShops(userShops);

      // Restore last selected shop from localStorage
      const savedShopId = localStorage.getItem('biashara_current_shop');

      if (savedShopId) {
        const shopToLoad = userShops.find(s => s.id === savedShopId);
        if (shopToLoad) {
          setCurrentShop(shopToLoad);
        } else if (userShops.length > 0) {
          setCurrentShop(userShops[0]);
          localStorage.setItem('biashara_current_shop', userShops[0].id);
        }
      } else if (userShops.length > 0) {
        setCurrentShop(userShops[0]);
        localStorage.setItem('biashara_current_shop', userShops[0].id);
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
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return false;
    }

    try {
      // Verify we have an active session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({ title: "Error", description: "Session expired. Please log in again.", variant: "destructive" });
        return false;
      }

      const { data, error } = await supabase
        .from('shops')
        .insert({
          name: newShop.name,
          location: newShop.location,
          phone: newShop.phone,
          email: newShop.email,
          currency: newShop.currency || 'KES',
          logo_url: newShop.logo_url,
          owner_id: sessionData.session.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error.message, error.details, error.hint, error.code);
        throw error;
      }

      const shop = data as Shop;
      setShops(prev => [shop, ...prev]);

      if (!currentShop) {
        setCurrentShop(shop);
        localStorage.setItem('biashara_current_shop', shop.id);
      }

      toast({ title: "Success", description: `Shop "${shop.name}" has been added.` });
      return true;
    } catch (error) {
      console.error('Error adding shop:', error);
      toast({ title: "Error", description: "Failed to add shop.", variant: "destructive" });
      return false;
    }
  };

  const updateShop = async (updatedShop: Shop): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: updatedShop.name,
          location: updatedShop.location,
          phone: updatedShop.phone,
          email: updatedShop.email,
          currency: updatedShop.currency,
          logo_url: updatedShop.logo_url,
          is_active: updatedShop.is_active,
        })
        .eq('id', updatedShop.id);

      if (error) throw error;

      setShops(prev => prev.map(shop => shop.id === updatedShop.id ? updatedShop : shop));

      if (currentShop && currentShop.id === updatedShop.id) {
        setCurrentShop(updatedShop);
      }

      toast({ title: "Success", description: `Shop "${updatedShop.name}" has been updated.` });
      return true;
    } catch (error) {
      console.error('Error updating shop:', error);
      toast({ title: "Error", description: "Failed to update shop.", variant: "destructive" });
      return false;
    }
  };

  const deleteShop = async (shopId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId);

      if (error) throw error;

      const newShopsList = shops.filter(shop => shop.id !== shopId);
      setShops(newShopsList);

      if (currentShop && currentShop.id === shopId) {
        if (newShopsList.length > 0) {
          setCurrentShop(newShopsList[0]);
          localStorage.setItem('biashara_current_shop', newShopsList[0].id);
        } else {
          setCurrentShop(null);
          localStorage.removeItem('biashara_current_shop');
        }
      }

      toast({ title: "Success", description: "Shop has been deleted." });
      return true;
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast({ title: "Error", description: "Failed to delete shop.", variant: "destructive" });
      return false;
    }
  };

  const switchShop = (shopId: string) => {
    const shop = shops.find(s => s.id === shopId);
    if (shop) {
      setCurrentShop(shop);
      localStorage.setItem('biashara_current_shop', shopId);
      queryClient.invalidateQueries();
      toast({ title: "Shop Switched", description: `Now using "${shop.name}"` });
    }
  };

  return (
    <ShopContext.Provider value={{ currentShop, shops, addShop, updateShop, deleteShop, switchShop, loading }}>
      {children}
    </ShopContext.Provider>
  );
};
