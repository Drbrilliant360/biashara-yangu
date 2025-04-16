
/**
 * Service to handle local storage data persistence
 */

// List of storage keys
export const STORAGE_KEYS = {
  CURRENT_USER: 'biashara_current_user',
  USERS: 'biashara_users',
  CURRENT_SHOP: 'biashara_current_shop',
  SHOPS: 'biashara_shops',
  PRODUCTS: 'biashara_products',
  SALES: 'biashara_sales',
  EXPENSES: 'biashara_expenses',
  CUSTOMERS: 'biashara_customers'
};

// Generic storage functions
export const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error getting data from storage:', error);
    return defaultValue;
  }
};

export const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving data to storage:', error);
  }
};

// Remove item from storage
export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing data from storage:', error);
  }
};

// Clear all app data
export const clearAllData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing all data from storage:', error);
  }
};
