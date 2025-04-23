
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
    // Add more here as needed
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
    // Add more here as needed
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

  const t = (key: string) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

