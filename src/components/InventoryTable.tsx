import { useState } from 'react';
import { Plus, Trash2, ImagePlus, Download } from 'lucide-react';
import { InventoryItem, Settings } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { exportInventoryToExcel } from '@/lib/exportUtils';
import { compressImage } from '@/lib/imageUtils';
import { AddInventoryDialog } from './AddInventoryDialog';
import { Button } from '@/components/ui/button';

interface InventoryTableProps {
  items: InventoryItem[];
  settings: Settings;
  storeName: string;
  onAddItem: (item: Omit<InventoryItem, 'id' | 'sellingPriceJPY'>) => void;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteItem: (id: string) => void;
}

export function InventoryTable({
  items,
  settings,
  storeName,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: InventoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    itemId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // Compress image to save storage space
        const compressed = await compressImage(base64, 200, 0.6);
        onUpdateItem(itemId, { photo: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (amount: number, currency: 'CNY' | 'JPY') => {
    if (currency === 'CNY') {
      return `¥${amount.toLocaleString()} 元`;
    }
    return `¥${amount.toLocaleString()}`;
  };

  const handleExport = async () => {
    await exportInventoryToExcel(items, settings, storeName);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">庫存管理</h2>
          <p className="text-muted-foreground text-sm mt-1">
            商品の在庫を管理します。人民幣で原価を入力すると自動で販売価格が計算されます。
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新增庫存
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={items.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            匯出 Excel
          </Button>
          <div className="text-right text-sm text-muted-foreground">
            <p>匯率: 1 CNY = {settings.exchangeRate} JPY</p>
            <p>目標利潤: ¥{settings.targetProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <AddInventoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        settings={settings}
        onAddItem={onAddItem}
      />

      <div className="table-container overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr>
              <th className="table-header-cell w-20">照片</th>
              <th className="table-header-cell">商品名稱</th>
              <th className="table-header-cell w-24">顏色</th>
              <th className="table-header-cell w-20">尺寸</th>
              <th className="table-header-cell w-20 text-center">數量</th>
              <th className="table-header-cell w-32 text-right">成本 (CNY)</th>
              <th className="table-header-cell w-32 text-right">販賣價格 (JPY)</th>
              <th className="table-header-cell w-20"></th>
            </tr>
          </thead>
          <tbody>
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
                      onChange={(e) => handleImageUpload(e, item.id)}
                    />
                  </label>
                </td>
                <td className="table-cell">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      defaultValue={item.productName}
                      onBlur={(e) => {
                        onUpdateItem(item.id, { productName: e.target.value });
                        setEditingId(null);
                      }}
                      className="input-field w-full"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-primary"
                      onClick={() => setEditingId(item.id)}
                    >
                      {item.productName}
                    </span>
                  )}
                </td>
                <td className="table-cell">
                  <input
                    type="text"
                    defaultValue={item.color}
                    onBlur={(e) => onUpdateItem(item.id, { color: e.target.value })}
                    className="input-field w-full"
                  />
                </td>
                <td className="table-cell">
                  <input
                    type="text"
                    defaultValue={item.size}
                    onBlur={(e) => onUpdateItem(item.id, { size: e.target.value })}
                    className="input-field w-full"
                  />
                </td>
                <td className="table-cell">
                  <input
                    type="number"
                    defaultValue={item.quantity}
                    onBlur={(e) => onUpdateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="input-field w-full text-center"
                  />
                </td>
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
                <td className="table-cell text-right font-semibold text-primary">
                  {formatCurrency(item.sellingPriceJPY, 'JPY')}
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
                <td colSpan={8} className="table-cell text-center py-12 text-muted-foreground">
                  まだ商品がありません。上の行から新しい商品を追加してください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">商品種類</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">総在庫数</p>
            <p className="text-2xl font-bold">{items.reduce((sum, i) => sum + i.quantity, 0)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">総原価 (CNY)</p>
            <p className="text-2xl font-bold">
              ¥{items.reduce((sum, i) => sum + i.costPriceCNY * i.quantity, 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
