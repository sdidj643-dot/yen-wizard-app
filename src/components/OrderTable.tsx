import { useState, useMemo } from 'react';
import { Plus, Trash2, ImagePlus, TrendingUp, TrendingDown, Download, ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { OrderItem, Settings } from '@/types/inventory';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { exportOrdersToCSV } from '@/lib/exportUtils';
import { AddOrderDialog } from './AddOrderDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrderTableProps {
  items: OrderItem[];
  settings: Settings;
  storeName: string;
  onAddItem: (item: Omit<OrderItem, 'id' | 'convertedWithShipping' | 'profit'>, createdAt?: string) => void;
  onUpdateItem: (id: string, updates: Partial<OrderItem>) => void;
  onDeleteItem: (id: string) => void;
}

const months = [
  { value: '1', label: '1月' },
  { value: '2', label: '2月' },
  { value: '3', label: '3月' },
  { value: '4', label: '4月' },
  { value: '5', label: '5月' },
  { value: '6', label: '6月' },
  { value: '7', label: '7月' },
  { value: '8', label: '8月' },
  { value: '9', label: '9月' },
  { value: '10', label: '10月' },
  { value: '11', label: '11月' },
  { value: '12', label: '12月' },
];

export function OrderTable({
  items,
  settings,
  storeName,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: OrderTableProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    itemId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onUpdateItem(itemId, { photo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate available years from orders
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(now.getFullYear());
    items.forEach(item => {
      if (item.createdAt) {
        years.add(new Date(item.createdAt).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  // Filter items by selected month/year
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!item.createdAt) return false;
      const date = new Date(item.createdAt);
      return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
    });
  }, [items, selectedYear, selectedMonth]);

  const totalProfit = filteredItems.reduce((sum, i) => sum + i.profit, 0);
  const totalRevenue = filteredItems.reduce((sum, i) => sum + i.actualPayment, 0);
  const totalCost = filteredItems.reduce((sum, i) => sum + i.convertedWithShipping, 0);

  const handleExport = () => {
    exportOrdersToCSV(filteredItems, `${storeName}_${selectedYear}年${selectedMonth}月`);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">訂單管理</h2>
          <p className="text-muted-foreground text-sm mt-1">
            販売した商品を記録し、利益を自動計算します。
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增訂單
          </button>
          <button
            onClick={handleExport}
            disabled={filteredItems.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filteredItems.length > 0
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Download className="w-4 h-4" />
            匯出 CSV
          </button>
          <div className="text-right text-sm text-muted-foreground">
            <p>匯率: 1 CNY = {settings.exchangeRate} JPY</p>
            <p>運費込み計算: +¥1,000</p>
          </div>
        </div>
      </div>

      {/* Add Order Dialog */}
      <AddOrderDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        settings={settings}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onAddItem={onAddItem}
      />

      {/* Month/Year Selector */}
      <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
        <span className="text-sm font-medium text-muted-foreground">期間選擇:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="ml-auto text-sm text-muted-foreground">
          該月訂單數: <span className="font-semibold text-foreground">{filteredItems.length}</span> 件
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
              <th className="table-header-cell w-32">完成日期</th>
              <th className="table-header-cell w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors w-full"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        {item.completedAt ? format(new Date(item.completedAt), 'yyyy/MM/dd') : '選擇日期'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={item.completedAt ? new Date(item.completedAt) : undefined}
                        onSelect={(date) => onUpdateItem(item.id, { completedAt: date?.toISOString() || '' })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
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

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={10} className="table-cell text-center py-12 text-muted-foreground">
                  {selectedYear}年{selectedMonth}月 沒有訂單記錄。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">{selectedMonth}月 注文数</p>
            <p className="text-2xl font-bold">{filteredItems.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">{selectedMonth}月 売上合計</p>
            <p className="text-2xl font-bold">¥{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">{selectedMonth}月 原価合計</p>
            <p className="text-2xl font-bold">¥{totalCost.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">{selectedMonth}月 利益合計</p>
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
