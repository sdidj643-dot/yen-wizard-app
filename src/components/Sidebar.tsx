import { useState } from 'react';
import { Store, Plus, Settings, Package, ShoppingCart, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Store as StoreType } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface SidebarProps {
  stores: StoreType[];
  activeStoreId: string | null;
  onSelectStore: (id: string) => void;
  onAddStore: (name: string) => void;
  onUpdateStoreName: (id: string, name: string) => void;
  onDeleteStore: (id: string) => void;
  activeTab: 'inventory' | 'orders' | 'settings';
  onTabChange: (tab: 'inventory' | 'orders' | 'settings') => void;
}

export function Sidebar({
  stores,
  activeStoreId,
  onSelectStore,
  onAddStore,
  onUpdateStoreName,
  onDeleteStore,
  activeTab,
  onTabChange,
}: SidebarProps) {
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAddStore = () => {
    if (newStoreName.trim()) {
      onAddStore(newStoreName.trim());
      setNewStoreName('');
      setIsAddingStore(false);
    }
  };

  const handleStartEdit = (store: StoreType) => {
    setEditingStoreId(store.id);
    setEditingName(store.name);
  };

  const handleSaveEdit = () => {
    if (editingStoreId && editingName.trim()) {
      onUpdateStoreName(editingStoreId, editingName.trim());
      setEditingStoreId(null);
      setEditingName('');
    }
  };

  return (
    <aside 
      className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col h-screen transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-10 w-6 h-6 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-md hover:bg-sidebar-primary/90 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">メルカリ管理</h1>
              <p className="text-xs text-sidebar-foreground/60">在庫・受注管理</p>
            </div>
          )}
        </div>
      </div>

      {/* Stores List */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {!isCollapsed && (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                店舗一覧
              </span>
              <button
                onClick={() => setIsAddingStore(true)}
                className="p-1 rounded hover:bg-sidebar-accent transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isAddingStore && (
              <div className="mb-2 flex gap-2">
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="店舗名を入力"
                  className="flex-1 px-2 py-1.5 text-sm bg-sidebar-accent rounded text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
                />
                <button onClick={handleAddStore} className="p-1.5 rounded bg-sidebar-primary text-sidebar-primary-foreground">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setIsAddingStore(false)} className="p-1.5 rounded hover:bg-sidebar-accent">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        <div className="space-y-1">
          {stores.map((store) => (
            <div
              key={store.id}
              className={cn(
                "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                activeStoreId === store.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50",
                isCollapsed && "justify-center px-2"
              )}
              onClick={() => onSelectStore(store.id)}
              title={isCollapsed ? store.name : undefined}
            >
              <Store className="w-4 h-4 flex-shrink-0" />
              
              {!isCollapsed && (
                editingStoreId === store.id ? (
                  <div className="flex-1 flex gap-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-1 py-0.5 text-sm bg-sidebar-accent rounded focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} className="p-0.5">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingStoreId(null); }} className="p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm truncate">{store.name}</span>
                    <div className="hidden group-hover:flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(store); }}
                        className="p-0.5 rounded hover:bg-sidebar-border"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {stores.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteStore(store.id); }}
                          className="p-0.5 rounded hover:bg-sidebar-border text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => onTabChange('inventory')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
            activeTab === 'inventory'
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "hover:bg-sidebar-accent",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "庫存管理" : undefined}
        >
          <Package className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">庫存管理</span>}
        </button>
        <button
          onClick={() => onTabChange('orders')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
            activeTab === 'orders'
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "hover:bg-sidebar-accent",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "訂單管理" : undefined}
        >
          <ShoppingCart className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">訂單管理</span>}
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
            activeTab === 'settings'
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "hover:bg-sidebar-accent",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "設定" : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">設定</span>}
        </button>
      </div>
    </aside>
  );
}
