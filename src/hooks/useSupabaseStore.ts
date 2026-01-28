import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  defaultSettings,
  calculateSellingPrice,
  calculateConvertedWithShipping,
  calculateProfit
} from '@/types/inventory';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  store_id: string;
  photo: string | null;
  product_name: string;
  color: string | null;
  size: string | null;
  quantity: number;
  cost_price_cny: number;
  selling_price_jpy: number;
}

interface OrderItem {
  id: string;
  store_id: string;
  photo: string | null;
  product_name: string;
  color: string | null;
  size: string | null;
  cost_price_cny: number;
  converted_with_shipping: number;
  actual_payment: number;
  profit: number;
  created_at: string;
  completed_at: string;
}

// Convert DB format to frontend format
const toFrontendInventory = (item: InventoryItem) => ({
  id: item.id,
  photo: item.photo || '',
  productName: item.product_name,
  color: item.color || '',
  size: item.size || '',
  quantity: item.quantity,
  costPriceCNY: Number(item.cost_price_cny),
  sellingPriceJPY: Number(item.selling_price_jpy),
});

const toFrontendOrder = (item: OrderItem) => ({
  id: item.id,
  photo: item.photo || '',
  productName: item.product_name,
  color: item.color || '',
  size: item.size || '',
  costPriceCNY: Number(item.cost_price_cny),
  convertedWithShipping: Number(item.converted_with_shipping),
  actualPayment: Number(item.actual_payment),
  profit: Number(item.profit),
  createdAt: item.created_at,
  completedAt: item.completed_at,
});

const toFrontendSettings = (s: any): Settings => ({
  exchangeRate: Number(s.exchange_rate),
  internationalShipping: Number(s.international_shipping),
  domesticShipping: Number(s.domestic_shipping),
  targetProfit: Number(s.target_profit),
  platformFeeRate: Number(s.platform_fee_rate),
});

export function useSupabaseStore() {
  const [stores, setStores] = useState<Array<{ id: string; name: string; inventory: any[]; orders: any[] }>>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      // Fetch stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (storesError) throw storesError;

      // Fetch inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*');
      
      if (inventoryError) throw inventoryError;

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('order_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (settingsError) throw settingsError;

      // Map inventory and orders to stores
      const storesWithData = (storesData || []).map(store => ({
        id: store.id,
        name: store.name,
        inventory: (inventoryData || [])
          .filter(item => item.store_id === store.id)
          .map(toFrontendInventory),
        orders: (ordersData || [])
          .filter(item => item.store_id === store.id)
          .map(toFrontendOrder),
      }));

      setStores(storesWithData);
      
      if (storesWithData.length > 0 && !activeStoreId) {
        setActiveStoreId(storesWithData[0].id);
      }

      if (settingsData) {
        setSettings(toFrontendSettings(settingsData));
        setSettingsId(settingsData.id);
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('資料載入失敗: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeStoreId]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchData();

    // Subscribe to realtime changes
    const storesChannel = supabase
      .channel('stores-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(storesChannel);
    };
  }, [fetchData]);

  const activeStore = stores.find(s => s.id === activeStoreId) || null;

  // Store operations
  const addStore = useCallback(async (name: string) => {
    const { data, error } = await supabase
      .from('stores')
      .insert({ name })
      .select()
      .single();
    
    if (error) {
      toast.error('新增店舖失敗');
      return;
    }
    setActiveStoreId(data.id);
  }, []);

  const updateStoreName = useCallback(async (storeId: string, name: string) => {
    const { error } = await supabase
      .from('stores')
      .update({ name })
      .eq('id', storeId);
    
    if (error) {
      toast.error('更新店舖名稱失敗');
    }
  }, []);

  const deleteStore = useCallback(async (storeId: string) => {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);
    
    if (error) {
      toast.error('刪除店舖失敗');
      return;
    }

    if (activeStoreId === storeId) {
      const remaining = stores.filter(s => s.id !== storeId);
      setActiveStoreId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [activeStoreId, stores]);

  // Inventory operations
  const addInventoryItem = useCallback(async (item: any) => {
    if (!activeStoreId) return;
    
    const sellingPrice = calculateSellingPrice(item.costPriceCNY, settings);
    
    const { error } = await supabase
      .from('inventory_items')
      .insert({
        store_id: activeStoreId,
        photo: item.photo || null,
        product_name: item.productName,
        color: item.color || null,
        size: item.size || null,
        quantity: item.quantity,
        cost_price_cny: item.costPriceCNY,
        selling_price_jpy: sellingPrice,
      });
    
    if (error) {
      toast.error('新增庫存失敗');
    }
  }, [activeStoreId, settings]);

  const updateInventoryItem = useCallback(async (itemId: string, updates: any) => {
    const updateData: any = {};
    
    if (updates.photo !== undefined) updateData.photo = updates.photo || null;
    if (updates.productName !== undefined) updateData.product_name = updates.productName;
    if (updates.color !== undefined) updateData.color = updates.color || null;
    if (updates.size !== undefined) updateData.size = updates.size || null;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.costPriceCNY !== undefined) {
      updateData.cost_price_cny = updates.costPriceCNY;
      updateData.selling_price_jpy = calculateSellingPrice(updates.costPriceCNY, settings);
    }
    
    const { error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', itemId);
    
    if (error) {
      toast.error('更新庫存失敗');
    }
  }, [settings]);

  const deleteInventoryItem = useCallback(async (itemId: string) => {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      toast.error('刪除庫存失敗');
    }
  }, []);

  // Order operations
  const addOrderItem = useCallback(async (item: any, createdAt?: string) => {
    if (!activeStoreId) return;
    
    const convertedWithShipping = calculateConvertedWithShipping(item.costPriceCNY, settings.exchangeRate);
    const profit = calculateProfit(item.actualPayment, convertedWithShipping);
    const orderDate = createdAt || item.createdAt || new Date().toISOString();
    
    const { error } = await supabase
      .from('order_items')
      .insert({
        store_id: activeStoreId,
        photo: item.photo || null,
        product_name: item.productName,
        color: item.color || null,
        size: item.size || null,
        cost_price_cny: item.costPriceCNY,
        converted_with_shipping: convertedWithShipping,
        actual_payment: item.actualPayment,
        profit,
        created_at: orderDate,
        completed_at: item.completedAt || orderDate,
      });
    
    if (error) {
      toast.error('新增訂單失敗');
    }
  }, [activeStoreId, settings.exchangeRate]);

  const updateOrderItem = useCallback(async (itemId: string, updates: any) => {
    // First get current item to recalculate if needed
    const currentOrder = stores
      .flatMap(s => s.orders)
      .find(o => o.id === itemId);
    
    if (!currentOrder) return;

    const updateData: any = {};
    
    if (updates.photo !== undefined) updateData.photo = updates.photo || null;
    if (updates.productName !== undefined) updateData.product_name = updates.productName;
    if (updates.color !== undefined) updateData.color = updates.color || null;
    if (updates.size !== undefined) updateData.size = updates.size || null;
    if (updates.createdAt !== undefined) updateData.created_at = updates.createdAt;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
    
    let costPrice = currentOrder.costPriceCNY;
    let actualPayment = currentOrder.actualPayment;
    
    if (updates.costPriceCNY !== undefined) {
      costPrice = updates.costPriceCNY;
      updateData.cost_price_cny = costPrice;
    }
    
    if (updates.actualPayment !== undefined) {
      actualPayment = updates.actualPayment;
      updateData.actual_payment = actualPayment;
    }
    
    if (updates.costPriceCNY !== undefined || updates.actualPayment !== undefined) {
      const converted = calculateConvertedWithShipping(costPrice, settings.exchangeRate);
      updateData.converted_with_shipping = converted;
      updateData.profit = calculateProfit(actualPayment, converted);
    }
    
    const { error } = await supabase
      .from('order_items')
      .update(updateData)
      .eq('id', itemId);
    
    if (error) {
      toast.error('更新訂單失敗');
    }
  }, [stores, settings.exchangeRate]);

  const deleteOrderItem = useCallback(async (itemId: string) => {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      toast.error('刪除訂單失敗');
    }
  }, []);

  // Settings operations
  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    const updateData: any = {};
    if (newSettings.exchangeRate !== undefined) updateData.exchange_rate = newSettings.exchangeRate;
    if (newSettings.internationalShipping !== undefined) updateData.international_shipping = newSettings.internationalShipping;
    if (newSettings.domesticShipping !== undefined) updateData.domestic_shipping = newSettings.domesticShipping;
    if (newSettings.targetProfit !== undefined) updateData.target_profit = newSettings.targetProfit;
    if (newSettings.platformFeeRate !== undefined) updateData.platform_fee_rate = newSettings.platformFeeRate;
    
    if (settingsId) {
      const { error } = await supabase
        .from('settings')
        .update(updateData)
        .eq('id', settingsId);
      
      if (error) {
        toast.error('更新設定失敗');
      }
    } else {
      const { data, error } = await supabase
        .from('settings')
        .insert(updateData)
        .select()
        .single();
      
      if (error) {
        toast.error('儲存設定失敗');
      } else {
        setSettingsId(data.id);
      }
    }
  }, [settings, settingsId]);

  const recalculateAllPrices = useCallback(async () => {
    // Recalculate inventory prices
    for (const store of stores) {
      for (const item of store.inventory) {
        const newPrice = calculateSellingPrice(item.costPriceCNY, settings);
        await supabase
          .from('inventory_items')
          .update({ selling_price_jpy: newPrice })
          .eq('id', item.id);
      }
      
      // Recalculate order profits
      for (const order of store.orders) {
        const converted = calculateConvertedWithShipping(order.costPriceCNY, settings.exchangeRate);
        const profit = calculateProfit(order.actualPayment, converted);
        await supabase
          .from('order_items')
          .update({ 
            converted_with_shipping: converted,
            profit 
          })
          .eq('id', order.id);
      }
    }
    
    toast.success('已重新計算所有價格');
  }, [stores, settings]);

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
