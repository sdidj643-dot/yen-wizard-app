import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  InventoryItem, 
  OrderItem, 
  defaultSettings,
  calculateSellingPrice,
  calculateConvertedWithShipping,
  calculateProfit
} from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';

interface CloudStore {
  id: string;
  name: string;
  inventory: InventoryItem[];
  orders: OrderItem[];
}

export function useCloudStore() {
  const [stores, setStores] = useState<CloudStore[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all data from cloud
  const fetchData = useCallback(async () => {
    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settingsData) {
        setSettings({
          exchangeRate: Number(settingsData.exchange_rate),
          internationalShipping: Number(settingsData.international_shipping),
          domesticShipping: Number(settingsData.domestic_shipping),
          targetProfit: Number(settingsData.target_profit),
          platformFeeRate: Number(settingsData.platform_fee_rate),
        });
        setSettingsId(settingsData.id);
      }

      // Fetch stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: true });

      if (storesError) throw storesError;

      // Fetch inventory items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (inventoryError) throw inventoryError;

      // Fetch order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('order_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Group inventory and orders by store
      const cloudStores: CloudStore[] = (storesData || []).map(store => ({
        id: store.id,
        name: store.name,
        inventory: (inventoryData || [])
          .filter(item => item.store_id === store.id)
          .map(item => ({
            id: item.id,
            photo: item.photo || '',
            productName: item.product_name,
            color: item.color || '',
            size: item.size || '',
            quantity: item.quantity,
            costPriceCNY: Number(item.cost_price_cny),
            sellingPriceJPY: Number(item.selling_price_jpy),
          })),
        orders: (ordersData || [])
          .filter(item => item.store_id === store.id)
          .map(item => ({
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
          })),
      }));

      // If no stores exist, create a default one
      if (cloudStores.length === 0) {
        const { data: newStore, error: createError } = await supabase
          .from('stores')
          .insert({ name: 'メルカリ店舗1' })
          .select()
          .single();

        if (createError) throw createError;

        cloudStores.push({
          id: newStore.id,
          name: newStore.name,
          inventory: [],
          orders: [],
        });
      }

      setStores(cloudStores);
      if (!activeStoreId || !cloudStores.find(s => s.id === activeStoreId)) {
        setActiveStoreId(cloudStores[0]?.id || null);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'エラー',
        description: 'データの読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeStoreId, toast]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stores' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const activeStore = stores.find(s => s.id === activeStoreId) || null;

  const addStore = useCallback(async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      setActiveStoreId(data.id);
    } catch (error) {
      console.error('Failed to add store:', error);
      toast({
        title: 'エラー',
        description: '店舗の追加に失敗しました',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const updateStoreName = useCallback(async (storeId: string, name: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ name })
        .eq('id', storeId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update store name:', error);
      toast({
        title: 'エラー',
        description: '店舗名の更新に失敗しました',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const deleteStore = useCallback(async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      if (activeStoreId === storeId) {
        const remaining = stores.filter(s => s.id !== storeId);
        setActiveStoreId(remaining[0]?.id || null);
      }
    } catch (error) {
      console.error('Failed to delete store:', error);
      toast({
        title: 'エラー',
        description: '店舗の削除に失敗しました',
        variant: 'destructive',
      });
    }
  }, [activeStoreId, stores, toast]);

  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'sellingPriceJPY'>) => {
    if (!activeStoreId) return;

    try {
      const sellingPriceJPY = calculateSellingPrice(item.costPriceCNY, settings);

      const { error } = await supabase
        .from('inventory_items')
        .insert({
          store_id: activeStoreId,
          photo: item.photo,
          product_name: item.productName,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          cost_price_cny: item.costPriceCNY,
          selling_price_jpy: sellingPriceJPY,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      toast({
        title: 'エラー',
        description: '在庫の追加に失敗しました',
        variant: 'destructive',
      });
    }
  }, [activeStoreId, settings, toast]);

  const updateInventoryItem = useCallback(async (itemId: string, updates: Partial<InventoryItem>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
      if (updates.productName !== undefined) dbUpdates.product_name = updates.productName;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.size !== undefined) dbUpdates.size = updates.size;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.costPriceCNY !== undefined) {
        dbUpdates.cost_price_cny = updates.costPriceCNY;
        dbUpdates.selling_price_jpy = calculateSellingPrice(updates.costPriceCNY, settings);
      }

      const { error } = await supabase
        .from('inventory_items')
        .update(dbUpdates)
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      toast({
        title: 'エラー',
        description: '在庫の更新に失敗しました',
        variant: 'destructive',
      });
    }
  }, [settings, toast]);

  const deleteInventoryItem = useCallback(async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      toast({
        title: 'エラー',
        description: '在庫の削除に失敗しました',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const addOrderItem = useCallback(async (item: Omit<OrderItem, 'id' | 'convertedWithShipping' | 'profit'>, createdAt?: string) => {
    if (!activeStoreId) return;

    try {
      const convertedWithShipping = calculateConvertedWithShipping(item.costPriceCNY, settings.exchangeRate);
      const profit = calculateProfit(item.actualPayment, convertedWithShipping);
      const orderDate = createdAt || item.createdAt || new Date().toISOString();

      const { error } = await supabase
        .from('order_items')
        .insert({
          store_id: activeStoreId,
          photo: item.photo,
          product_name: item.productName,
          color: item.color,
          size: item.size,
          cost_price_cny: item.costPriceCNY,
          converted_with_shipping: convertedWithShipping,
          actual_payment: item.actualPayment,
          profit: profit,
          created_at: orderDate,
          completed_at: item.completedAt || orderDate,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to add order item:', error);
      toast({
        title: 'エラー',
        description: '注文の追加に失敗しました',
        variant: 'destructive',
      });
    }
  }, [activeStoreId, settings.exchangeRate, toast]);

  const updateOrderItem = useCallback(async (itemId: string, updates: Partial<OrderItem>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
      if (updates.productName !== undefined) dbUpdates.product_name = updates.productName;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.size !== undefined) dbUpdates.size = updates.size;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
      if (updates.actualPayment !== undefined) dbUpdates.actual_payment = updates.actualPayment;
      
      if (updates.costPriceCNY !== undefined) {
        dbUpdates.cost_price_cny = updates.costPriceCNY;
        const convertedWithShipping = calculateConvertedWithShipping(updates.costPriceCNY, settings.exchangeRate);
        dbUpdates.converted_with_shipping = convertedWithShipping;
        
        // Recalculate profit if we have actual payment
        const currentOrder = stores.find(s => s.id === activeStoreId)?.orders.find(o => o.id === itemId);
        if (currentOrder) {
          const actualPayment = updates.actualPayment ?? currentOrder.actualPayment;
          dbUpdates.profit = calculateProfit(actualPayment, convertedWithShipping);
        }
      } else if (updates.actualPayment !== undefined) {
        const currentOrder = stores.find(s => s.id === activeStoreId)?.orders.find(o => o.id === itemId);
        if (currentOrder) {
          dbUpdates.profit = calculateProfit(updates.actualPayment, currentOrder.convertedWithShipping);
        }
      }

      const { error } = await supabase
        .from('order_items')
        .update(dbUpdates)
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update order item:', error);
      toast({
        title: 'エラー',
        description: '注文の更新に失敗しました',
        variant: 'destructive',
      });
    }
  }, [activeStoreId, settings.exchangeRate, stores, toast]);

  const deleteOrderItem = useCallback(async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete order item:', error);
      toast({
        title: 'エラー',
        description: '注文の削除に失敗しました',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      const dbUpdates = {
        exchange_rate: updatedSettings.exchangeRate,
        international_shipping: updatedSettings.internationalShipping,
        domestic_shipping: updatedSettings.domesticShipping,
        target_profit: updatedSettings.targetProfit,
        platform_fee_rate: updatedSettings.platformFeeRate,
      };

      if (settingsId) {
        const { error } = await supabase
          .from('settings')
          .update(dbUpdates)
          .eq('id', settingsId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: 'エラー',
        description: '設定の更新に失敗しました',
        variant: 'destructive',
      });
    }
  }, [settings, settingsId, toast]);

  const recalculateAllPrices = useCallback(async () => {
    try {
      // Recalculate all inventory prices
      for (const store of stores) {
        for (const item of store.inventory) {
          const newSellingPrice = calculateSellingPrice(item.costPriceCNY, settings);
          if (newSellingPrice !== item.sellingPriceJPY) {
            await supabase
              .from('inventory_items')
              .update({ selling_price_jpy: newSellingPrice })
              .eq('id', item.id);
          }
        }

        // Recalculate all order profits
        for (const order of store.orders) {
          const newConvertedWithShipping = calculateConvertedWithShipping(order.costPriceCNY, settings.exchangeRate);
          const newProfit = calculateProfit(order.actualPayment, newConvertedWithShipping);
          
          if (newConvertedWithShipping !== order.convertedWithShipping || newProfit !== order.profit) {
            await supabase
              .from('order_items')
              .update({
                converted_with_shipping: newConvertedWithShipping,
                profit: newProfit,
              })
              .eq('id', order.id);
          }
        }
      }

      toast({
        title: '完了',
        description: 'すべての価格を再計算しました',
      });
    } catch (error) {
      console.error('Failed to recalculate prices:', error);
      toast({
        title: 'エラー',
        description: '価格の再計算に失敗しました',
        variant: 'destructive',
      });
    }
  }, [settings, stores, toast]);

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
