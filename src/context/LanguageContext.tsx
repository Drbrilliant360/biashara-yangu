
import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "english" | "swahili";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  english: {
    dashboard: "Dashboard",
    pos: "POS",
    products: "Products",
    sales: "Sales",
    purchases: "Purchases",
    expenses: "Expenses",
    reports: "Reports",
    customers: "Customers",
    shops: "Shops",
    settings: "Settings",
    logout: "Logout",
    "business management system": "Business Management System",
    // Product page translations
    "add product": "Add Product",
    "product name": "Product Name",
    "category": "Category",
    "price": "Price",
    "stock": "Stock",
    "search products": "Search products...",
    "filter": "Filter",
    "no products found": "No products found",
    "add your first product": "Add your first product",
    // Settings page translations
    "general": "General",
    "appearance": "Appearance",
    "notifications": "Notifications",
    "profile": "Profile",
    "business": "Business",
    "general settings": "General Settings",
    "configure basic settings": "Configure basic settings for your application.",
    "language": "Language",
    "select a language": "Select a language",
    "currency": "Currency",
    "select a currency": "Select a currency",
    "save changes": "Save Changes",
    "settings saved": "Settings saved",
    "your general settings have been updated successfully": "Your general settings have been updated successfully.",
    "change language": "Change Language",
    "users": "Users",
    // Common UI elements
    "no shop selected": "No Shop Selected",
  },
  swahili: {
    dashboard: "Dashibodi",
    pos: "POS",
    products: "Bidhaa",
    sales: "Mauzo",
    purchases: "Manunuzi",
    expenses: "Matumizi",
    reports: "Ripoti",
    customers: "Wateja",
    shops: "Maduka",
    settings: "Mipangilio",
    logout: "Ondoka",
    "business management system": "Mfumo wa Usimamizi wa Biashara",
    // Product page translations
    "add product": "Ongeza Bidhaa",
    "product name": "Jina la Bidhaa",
    "category": "Kategoria",
    "price": "Bei",
    "stock": "Hifadhi",
    "search products": "Tafuta bidhaa...",
    "filter": "Chuja",
    "no products found": "Hakuna bidhaa zilizopatikana",
    "add your first product": "Ongeza bidhaa yako ya kwanza",
    // Settings page translations
    "general": "Jumla",
    "appearance": "Muonekano",
    "notifications": "Arifa",
    "profile": "Wasifu",
    "business": "Biashara",
    "general settings": "Mipangilio ya Jumla",
    "configure basic settings": "Sanidi mipangilio ya msingi ya programu yako.",
    "language": "Lugha",
    "select a language": "Chagua lugha",
    "currency": "Sarafu",
    "select a currency": "Chagua sarafu",
    "save changes": "Hifadhi Mabadiliko",
    "settings saved": "Mipangilio imehifadhiwa",
    "your general settings have been updated successfully": "Mipangilio yako ya jumla imesasishwa kwa mafanikio.",
    "change language": "Badilisha Lugha",
    "users": "Watumiaji",
    // Common UI elements
    "no shop selected": "Hakuna Duka Lililochaguliwa",
  }
};

const LanguageContext = createContext<LanguageContextProps>({
  language: "english",
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("biashara_language") as Language) || "english";
  });

  useEffect(() => {
    localStorage.setItem("biashara_language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => {
    const lowercaseKey = key.toLowerCase();
    return translations[language][lowercaseKey] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
