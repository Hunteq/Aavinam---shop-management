import { format } from 'date-fns';

const STORAGE_KEYS = {
  PRODUCTS: 'dsms_products',
  STOCK_LOGS: 'dsms_stock_logs',
  PRICE_LOGS: 'dsms_price_logs',
  DAILY_SUMMARIES: 'dsms_daily_summaries',
  USERS: 'dsms_users',
  SETTINGS: 'dsms_settings',
  ACTIVITY_LOGS: 'dsms_activity_logs',
  SESSION: 'dsms_session',
  EXPENSES: 'dsms_expenses',
  CASH_ENTRIES: 'dsms_cash_entries',
  LANGUAGE: 'dsms_language'
};

const INITIAL_DATA = {
  products: [
    { id: '1', name: 'Cow Milk', category: 'Dairy', enabled: true, unit: 'Liter', price: 60, history: [] },
    { id: '2', name: 'Buffalo Milk', category: 'Dairy', enabled: true, unit: 'Liter', price: 80, history: [] },
    { id: '3', name: 'Lemon Juice', category: 'Juice', enabled: true, unit: 'Liter', price: 40, history: [] }
  ],
  users: [
    { id: 'admin', username: 'admin', role: 'ADMIN', password: 'password' },
    { id: 'staff', username: 'staff', role: 'STAFF', password: 'password' }
  ],
  settings: {
    timeSlots: [
      { id: '1', time: '05:00', label: 'Opening stock' },
      { id: '2', time: '07:00', label: 'Fresh stock added' },
      { id: '3', time: '09:00', label: 'Additional fresh stock added' },
      { id: '4', time: '15:00', label: 'Midday review' },
      { id: '5', time: '17:00', label: 'Evening review' },
      { id: '6', time: '19:00', label: 'Night review' },
      { id: '7', time: '22:00', label: 'Closing report' }
    ],
    gstEnabled: false,
    lowStockThreshold: 10
  },
  price_logs: [],
  stock_logs: [],
  daily_summaries: [],
  activity_logs: [],
  expenses: [],
  cash_entries: []
};

export const storage = {
  get: (key) => {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length === 0) {
        const keyName = key.replace('dsms_', '');
        if (['users', 'settings', 'products'].includes(keyName)) {
           return INITIAL_DATA[keyName] || [];
        }
      }
      return parsed;
    }
    
    const keyName = key.replace('dsms_', '');
    if (INITIAL_DATA[keyName] !== undefined) return INITIAL_DATA[keyName];
    return keyName === 'session' ? null : [];
  },
  
  set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
  
  clear: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  initialize: () => {
    Object.entries(STORAGE_KEYS).forEach(([key, value]) => {
      if (!localStorage.getItem(value)) {
        const initialValue = INITIAL_DATA[key.toLowerCase()];
        if (initialValue) storage.set(value, initialValue);
      }
    });
  },

  logActivity: (user, type, description) => {
    const logs = storage.get(STORAGE_KEYS.ACTIVITY_LOGS);
    logs.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      description,
      user: {
        id: user?.id || 'system',
        username: user?.username || 'System',
        role: user?.role || 'SYSTEM'
      }
    });
    storage.set(STORAGE_KEYS.ACTIVITY_LOGS, logs);
  },

  logPriceChange: (user, productId, oldPrice, newPrice, unit = 'Liter') => {
    const logs = storage.get(STORAGE_KEYS.PRICE_LOGS);
    logs.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      username: user.username,
      productId,
      oldPrice,
      newPrice,
      unit
    });
    storage.set(STORAGE_KEYS.PRICE_LOGS, logs);
  },

  updateProductHistory: (productId, action, details) => {
    const products = storage.get(STORAGE_KEYS.PRODUCTS);
    const updated = products.map(p => {
      if (p.id === productId) {
        const history = p.history || [];
        history.push({
          date: new Date().toISOString(),
          action,
          details
        });
        return { ...p, history };
      }
      return p;
    });
    storage.set(STORAGE_KEYS.PRODUCTS, updated);
  },

  updateUsername: (userId, newUsername) => {
    const users = storage.get(STORAGE_KEYS.USERS);
    const updated = users.map(u => u.id === userId ? { ...u, username: newUsername } : u);
    storage.set(STORAGE_KEYS.USERS, updated);
  },

  updateUserMobile: (userId, mobile) => {
    const users = storage.get(STORAGE_KEYS.USERS);
    const updated = users.map(u => u.id === userId ? { ...u, mobile } : u);
    storage.set(STORAGE_KEYS.USERS, updated);
  },



  updateUserLanguage: (userId, language) => {
    const users = storage.get(STORAGE_KEYS.USERS);
    const updated = users.map(u => u.id === userId ? { ...u, language } : u);
    storage.set(STORAGE_KEYS.USERS, updated);
  },

  updateUserPassword: (userId, newPassword) => {
    const users = storage.get(STORAGE_KEYS.USERS);
    const updated = users.map(u => u.id === userId ? { ...u, password: newPassword } : u);
    storage.set(STORAGE_KEYS.USERS, updated);
  },

  addUser: (userData) => {
    const users = storage.get(STORAGE_KEYS.USERS);
    users.push(userData);
    storage.set(STORAGE_KEYS.USERS, users);
  },

  deleteUser: (userId) => {
    const users = storage.get(STORAGE_KEYS.USERS);
    const updated = users.filter(u => u.id !== userId);
    storage.set(STORAGE_KEYS.USERS, updated);
  }
};
