import { useState } from 'react';
import { Plus, Trash2, ImagePlus, TrendingUp, TrendingDown } from 'lucide-react';
import { OrderItem, Settings } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface OrderTableProps {
  items: OrderItem[];
  settings: Settings;
  onAddItem: (item: Omit<OrderItem, 'id' | 'convertedWithShipping' | 'profit' | 'createdAt'>) => void;
  onUpdateItem: (id: string, updates: Partial<OrderItem>) => void;
  onDeleteItem: (id: string) => void;
}

const emptyItem = {
  photo: '',
  productName: '',
  color: '',
  size: '',
  costPriceCNY: 0,
  actualPayment: 0,
};

export function OrderTable({
  items,
  settings,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: OrderTableProps) {
  const [newItem, setNewItem] = useState(emptyItem);

  const handleAddItem = () => {
    if (newItem.productName.trim() && newItem.costPriceCNY > 0) {
      onAddItem(newItem);
      setNewItem(emptyItem);
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isNew: boolean,
    itemId?: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isNew) {
          setNewItem(prev => ({ ...prev, photo: base64 }));
        } else if (itemId) {
          onUpdateItem(itemId, { photo: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const totalProfit = items.reduce((sum, i) => sum + i.profit, 0);
  const totalRevenue = items.reduce((sum, i) => sum + i.actualPayment, 0);
  const totalCost = items.reduce((sum, i) => sum + i.convertedWithShipping, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">訂單管理</h2>
          <p className="text-muted-foreground text-sm mt-1">
            販売した商品を記録し、利益を自動計算します。
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>匯率: 1 CNY = {settings.exchangeRate} JPY</p>
          <p>運費込み計算: +¥1,000</p>
        </div>
      </div>

      <div className="table-container overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr>
              <th className="table-header-cell w-20">照片</th>
              <th className="table-header-cell">商品名稱</th>
              <th className="table-header-cell w-24">顏色</th>
              <th className="table-header-cell w-20">尺寸</th>
              <th className="table-header-cell w-28 text-right">成本 (CNY)</th>
              <th className="table-header-cell w-32 text-right">換算+運費</th>
              <th className="table-header-cell w-28 text-right">實際入帳</th>
              <th className="table-header-cell w-28 text-right">利潤</th>
              <th className="table-header-cell w-20"></th>
            </tr>
          </thead>
          <tbody>
            {/* New Item Row */}
            <tr className="bg-primary/5">
              <td className="table-cell">
                <label className="w-14 h-14 rounded-lg border-2 border-dashed border-primary/40 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden">
                  {newItem.photo ? (
                    <img src={newItem.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="w-5 h-5 text-primary/60" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, true)}
                  />
                </label>
              </td>
              <td className="table-cell">
                <input
                  type="text"
                  value={newItem.productName}
                  onChange={(e) => setNewItem(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="商品名稱を入力"
                  className="input-field w-full"
                />
              </td>
              <td className="table-cell">
                <input
                  type="text"
                  value={newItem.color}
                  onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="顏色"
                  className="input-field w-full"
                />
              </td>
              <td className="table-cell">
                <input
                  type="text"
                  value={newItem.size}
                  onChange={(e) => setNewItem(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="尺寸"
                  className="input-field w-full"
                />
              </td>
              <td className="table-cell">
                <input
                  type="number"
                  value={newItem.costPriceCNY || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, costPriceCNY: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="input-field w-full text-right"
                />
              </td>
              <td className="table-cell text-right text-muted-foreground">
                {newItem.costPriceCNY > 0 ? (
                  <span className="font-medium text-foreground">
                    ¥{Math.ceil(newItem.costPriceCNY * settings.exchangeRate + 1000).toLocaleString()}
                  </span>
                ) : '—'}
              </td>
              <td className="table-cell">
                <input
                  type="number"
                  value={newItem.actualPayment || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, actualPayment: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  className="input-field w-full text-right"
                />
              </td>
              <td className="table-cell text-right text-muted-foreground">
                {newItem.actualPayment > 0 && newItem.costPriceCNY > 0 ? (
                  <span className={cn(
                    "font-semibold",
                    newItem.actualPayment - Math.ceil(newItem.costPriceCNY * settings.exchangeRate + 1000) >= 0
                      ? "profit-positive"
                      : "profit-negative"
                  )}>
                    ¥{(newItem.actualPayment - Math.ceil(newItem.costPriceCNY * settings.exchangeRate + 1000)).toLocaleString()}
                  </span>
                ) : '—'}
              </td>
              <td className="table-cell">
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.productName.trim() || newItem.costPriceCNY <= 0}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    newItem.productName.trim() && newItem.costPriceCNY > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </td>
            </tr>

            {/* Existing Items */}
            {items.map((item) => (
              <tr key={item.id} className="table-row-interactive">
                <td className="table-cell">
                  <label className="w-14 h-14 rounded-lg border border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted">
                    {item.photo ? (
                      <img src={item.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, false, item.id)}
                    />
                  </label>
                </td>
                <td className="table-cell font-medium">{item.productName}</td>
                <td className="table-cell text-muted-foreground">{item.color || '—'}</td>
                <td className="table-cell text-muted-foreground">{item.size || '—'}</td>
                <td className="table-cell">
                  <input
                    type="number"
                    defaultValue={item.costPriceCNY}
                    onBlur={(e) => onUpdateItem(item.id, { costPriceCNY: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="input-field w-full text-right"
                  />
                </td>
                <td className="table-cell text-right font-medium">
                  ¥{item.convertedWithShipping.toLocaleString()}
                </td>
                <td className="table-cell">
                  <input
                    type="number"
                    defaultValue={item.actualPayment}
                    onBlur={(e) => onUpdateItem(item.id, { actualPayment: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="input-field w-full text-right"
                  />
                </td>
                <td className="table-cell text-right">
                  <span className={cn(
                    "font-semibold flex items-center justify-end gap-1",
                    item.profit >= 0 ? "profit-positive" : "profit-negative"
                  )}>
                    {item.profit >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    ¥{item.profit.toLocaleString()}
                  </span>
                </td>
                <td className="table-cell">
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="table-cell text-center py-12 text-muted-foreground">
                  まだ注文がありません。上の行から新しい注文を追加してください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">注文数</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">売上合計</p>
            <p className="text-2xl font-bold">¥{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">原価合計</p>
            <p className="text-2xl font-bold">¥{totalCost.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">利益合計</p>
            <p className={cn(
              "text-2xl font-bold",
              totalProfit >= 0 ? "profit-positive" : "profit-negative"
            )}>
              ¥{totalProfit.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
