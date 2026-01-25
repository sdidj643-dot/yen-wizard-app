import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { InventoryTable } from '@/components/InventoryTable';
import { OrderTable } from '@/components/OrderTable';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useCloudStore } from '@/hooks/useCloudStore';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Cloud, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Tab = 'inventory' | 'orders' | 'settings';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const { user, role, signOut } = useAuth();
  const {
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
  } = useCloudStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">クラウドからデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        stores={stores}
        activeStoreId={activeStoreId}
        onSelectStore={setActiveStoreId}
        onAddStore={addStore}
        onUpdateStoreName={updateStoreName}
        onDeleteStore={deleteStore}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header with user info */}
          <div className="flex justify-between items-start mb-6">
            {/* Store Header */}
            {activeStore && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Cloud className="w-4 h-4" />
                  <span>クラウド同期中 · 現在の店舗</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground">{activeStore.name}</h1>
              </div>
            )}
            
            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {role === 'admin' && '管理者'}
                  {role === 'owner' && 'オーナー'}
                  {role === 'employee' && '従業員'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-1" />
                ログアウト
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'inventory' && activeStore && (
            <InventoryTable
              items={activeStore.inventory}
              settings={settings}
              storeName={activeStore.name}
              onAddItem={addInventoryItem}
              onUpdateItem={updateInventoryItem}
              onDeleteItem={deleteInventoryItem}
            />
          )}

          {activeTab === 'orders' && activeStore && (
            <OrderTable
              items={activeStore.orders}
              settings={settings}
              storeName={activeStore.name}
              onAddItem={addOrderItem}
              onUpdateItem={updateOrderItem}
              onDeleteItem={deleteOrderItem}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel
              settings={settings}
              onUpdateSettings={updateSettings}
              onRecalculateAll={recalculateAllPrices}
              userRole={role}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
