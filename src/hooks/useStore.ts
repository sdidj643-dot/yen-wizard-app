import { useState, useEffect, useCallback } from 'react';
import { 
  Store, 
  Settings, 
  InventoryItem, 
  OrderItem, 
  defaultSettings, 
  generateId,
  calculateSellingPrice,
  calculateConvertedWithShipping,
  calculateProfit
} from '@/types/inventory';

const STORAGE_KEY = 'mercari-inventory-data';
const SETTINGS_KEY = 'mercari-inventory-settings';

interface StoreData {
  stores: Store[];
  activeStoreId: string | null;
}

export function useStore() {
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (savedData) {
      try {
        const data: StoreData = JSON.parse(savedData);
        setStores(data.stores);
        setActiveStoreId(data.activeStoreId);
      } catch (e) {
        console.error('Failed to parse stored data', e);
      }
    } else {
      // Create default store
      const defaultStore: Store = {
        id: generateId(),
        name: 'メルカリ店舗1',
        inventory: [],
        orders: [],
      };
      setStores([defaultStore]);
      setActiveStoreId(defaultStore.id);
    }

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }

    setIsLoading(false);
  }, []);

  // Save data to localStorage with error handling
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ stores, activeStoreId }));
      } catch (e) {
        console.error('Failed to save data to localStorage. Storage may be full.', e);
        // Could add a toast notification here to inform the user
      }
    }
  }, [stores, activeStoreId, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save settings to localStorage.', e);
      }
    }
  }, [settings, isLoading]);

  const activeStore = stores.find(s => s.id === activeStoreId) || null;

  const addStore = useCallback((name: string) => {
    const newStore: Store = {
      id: generateId(),
      name,
      inventory: [],
      orders: [],
    };
    setStores(prev => [...prev, newStore]);
    setActiveStoreId(newStore.id);
  }, []);

  const updateStoreName = useCallback((storeId: string, name: string) => {
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, name } : s));
  }, []);

  const deleteStore = useCallback((storeId: string) => {
    setStores(prev => {
      const newStores = prev.filter(s => s.id !== storeId);
      if (activeStoreId === storeId && newStores.length > 0) {
        setActiveStoreId(newStores[0].id);
      }
      return newStores;
    });
  }, [activeStoreId]);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'sellingPriceJPY'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      sellingPriceJPY: calculateSellingPrice(item.costPriceCNY, settings),
    };
    setStores(prev => prev.map(s => 
      s.id === activeStoreId 
        ? { ...s, inventory: [...s.inventory, newItem] }
        : s
    ));
  }, [activeStoreId, settings]);

  const updateInventoryItem = useCallback((itemId: string, updates: Partial<InventoryItem>) => {
    setStores(prev => prev.map(s => {
      if (s.id !== activeStoreId) return s;
      return {
        ...s,
        inventory: s.inventory.map(item => {
          if (item.id !== itemId) return item;
          const updated = { ...item, ...updates };
          if (updates.costPriceCNY !== undefined) {
            updated.sellingPriceJPY = calculateSellingPrice(updates.costPriceCNY, settings);
          }
          return updated;
        }),
      };
    }));
  }, [activeStoreId, settings]);

  const deleteInventoryItem = useCallback((itemId: string) => {
    setStores(prev => prev.map(s => 
      s.id === activeStoreId 
        ? { ...s, inventory: s.inventory.filter(item => item.id !== itemId) }
        : s
    ));
  }, [activeStoreId]);

  const addOrderItem = useCallback((item: Omit<OrderItem, 'id' | 'convertedWithShipping' | 'profit'>, createdAt?: string) => {
    const convertedWithShipping = calculateConvertedWithShipping(item.costPriceCNY, settings.exchangeRate);
    const profit = calculateProfit(item.actualPayment, convertedWithShipping);
    const orderDate = createdAt || item.createdAt || new Date().toISOString();
    const newItem: OrderItem = {
      ...item,
      id: generateId(),
      convertedWithShipping,
      profit,
      createdAt: orderDate,
      completedAt: item.completedAt || orderDate,
    };
    setStores(prev => prev.map(s => 
      s.id === activeStoreId 
        ? { ...s, orders: [...s.orders, newItem] }
        : s
    ));
  }, [activeStoreId, settings.exchangeRate]);

  const updateOrderItem = useCallback((itemId: string, updates: Partial<OrderItem>) => {
    setStores(prev => prev.map(s => {
      if (s.id !== activeStoreId) return s;
      return {
        ...s,
        orders: s.orders.map(item => {
          if (item.id !== itemId) return item;
          const updated = { ...item, ...updates };
          
          if (updates.costPriceCNY !== undefined) {
            updated.convertedWithShipping = calculateConvertedWithShipping(updates.costPriceCNY, settings.exchangeRate);
          }
          
          if (updates.actualPayment !== undefined || updates.costPriceCNY !== undefined) {
            updated.profit = calculateProfit(updated.actualPayment, updated.convertedWithShipping);
          }
          
          return updated;
        }),
      };
    }));
  }, [activeStoreId, settings.exchangeRate]);

  const deleteOrderItem = useCallback((itemId: string) => {
    setStores(prev => prev.map(s => 
      s.id === activeStoreId 
        ? { ...s, orders: s.orders.filter(item => item.id !== itemId) }
        : s
    ));
  }, [activeStoreId]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Recalculate all prices when settings change
  const recalculateAllPrices = useCallback(() => {
    setStores(prev => prev.map(store => ({
      ...store,
      inventory: store.inventory.map(item => ({
        ...item,
        sellingPriceJPY: calculateSellingPrice(item.costPriceCNY, settings),
      })),
      orders: store.orders.map(order => {
        const convertedWithShipping = calculateConvertedWithShipping(order.costPriceCNY, settings.exchangeRate);
        return {
          ...order,
          convertedWithShipping,
          profit: calculateProfit(order.actualPayment, convertedWithShipping),
        };
      }),
    })));
  }, [settings]);

  return {
    stores,
    activeStore,
    activeStoreId,
    setActiveStoreId,
    settings,
    isLoading,
    addStore,
    updateStoreName,
    deleteStore,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addOrderItem,
    updateOrderItem,
    deleteOrderItem,
    updateSettings,
    recalculateAllPrices,
  };
}
