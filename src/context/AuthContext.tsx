
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: { name: string; email: string; password: string }) => Promise<boolean>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  isAuthenticated: false,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

const mapSupabaseUser = (su: SupabaseUser): AppUser => ({
  id: su.id,
  name: su.user_metadata?.full_name || su.email?.split('@')[0] || 'User',
  email: su.email || '',
  role: 'owner',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }
      if (data.user) {
        setUser(mapSupabaseUser(data.user));
        toast({
          title: "Login Successful",
          description: `Welcome back!`,
        });
      }
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  };

  const register = async (userData: { name: string; email: string; password: string }): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: { full_name: userData.name },
        },
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }

      if (data.user && !data.session) {
        // Email confirmation required
        toast({
          title: "Check Your Email",
          description: "We've sent you a confirmation email. Please verify your email to continue.",
        });
        setLoading(false);
        return true;
      }

      if (data.user) {
        setUser(mapSupabaseUser(data.user));
        toast({
          title: "Registration Successful",
          description: `Welcome, ${userData.name}!`,
        });
      }

      setLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
