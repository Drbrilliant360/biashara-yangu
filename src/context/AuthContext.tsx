
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { User } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id'>) => Promise<boolean>;
  resetPassword: (email: string, securityAnswer: string, newPassword: string) => Promise<boolean>;
  verifySecurityQuestion: (email: string) => Promise<{ success: boolean; question?: string }>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  resetPassword: async () => false,
  verifySecurityQuestion: async () => ({ success: false }),
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Get all users from storage
      const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
      
      // Find user with matching email and password
      const foundUser = users.find(u => u.email === email && u.password === password);
      
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
          description: "Incorrect email or password. Please try again.",
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
      
      // Check if email is already in use
      if (users.some(u => u.email === newUser.email)) {
        toast({
          title: "Registration Failed",
          description: "Email is already in use. Please choose another.",
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
  
  const verifySecurityQuestion = async (email: string): Promise<{ success: boolean; question?: string }> => {
    try {
      const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
      const user = users.find(u => u.email === email);
      
      if (user && user.securityQuestion) {
        return { success: true, question: user.securityQuestion };
      } else {
        toast({
          title: "Account Not Found",
          description: "We couldn't find an account with that email.",
          variant: "destructive",
        });
        return { success: false };
      }
    } catch (error) {
      console.error('Security question verification error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    }
  };
  
  const resetPassword = async (email: string, securityAnswer: string, newPassword: string): Promise<boolean> => {
    try {
      const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
      const userIndex = users.findIndex(u => u.email === email);
      
      if (userIndex === -1) {
        toast({
          title: "Account Not Found",
          description: "We couldn't find an account with that email.",
          variant: "destructive",
        });
        return false;
      }
      
      if (users[userIndex].securityAnswer !== securityAnswer) {
        toast({
          title: "Incorrect Answer",
          description: "The security answer provided is incorrect.",
          variant: "destructive",
        });
        return false;
      }
      
      // Update the user's password
      users[userIndex].password = newPassword;
      setItem(STORAGE_KEYS.USERS, users);
      
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
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
      resetPassword,
      verifySecurityQuestion,
      isAuthenticated: !!user,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
