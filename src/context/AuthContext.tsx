
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { User } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  register: (user: Omit<User, 'id'>) => Promise<boolean>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    
    if (savedUser) {
      setUser(savedUser);
    }
    
    setLoading(false);
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Get all users from storage
      const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
      
      // Find user with matching PIN
      const foundUser = users.find(u => u.pin === pin);
      
      if (foundUser) {
        setUser(foundUser);
        setItem(STORAGE_KEYS.CURRENT_USER, foundUser);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${foundUser.name}!`,
        });
        setLoading(false);
        return true;
      } else {
        toast({
          title: "Login Failed",
          description: "Incorrect PIN. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }
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
  
  const register = async (newUser: Omit<User, 'id'>): Promise<boolean> => {
    setLoading(true);
    
    try {
      const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
      
      // Check if PIN is already in use
      if (users.some(u => u.pin === newUser.pin)) {
        toast({
          title: "Registration Failed",
          description: "PIN is already in use. Please choose another.",
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }
      
      // Create new user with ID
      const user: User = {
        ...newUser,
        id: Date.now().toString(),
      };
      
      // Add to users list and set as current user
      const updatedUsers = [...users, user];
      setItem(STORAGE_KEYS.USERS, updatedUsers);
      setItem(STORAGE_KEYS.CURRENT_USER, user);
      
      setUser(user);
      toast({
        title: "Registration Successful",
        description: `Welcome, ${user.name}!`,
      });
      
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
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
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
