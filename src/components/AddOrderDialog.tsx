import { useState } from 'react';
import { ImagePlus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Settings } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { compressImage } from '@/lib/imageUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  selectedYear: number;
  selectedMonth: number;
  onAddItem: (item: {
    photo: string;
    productName: string;
    color: string;
    size: string;
    costPriceCNY: number;
    actualPayment: number;
    completedAt: string;
    createdAt: string;
  }, createdAt: string) => void;
}

const emptyItem = {
  photo: '',
  productName: '',
  color: '',
  size: '',
  costPriceCNY: 0,
  actualPayment: 0,
  completedAt: '',
  createdAt: '',
};

export function AddOrderDialog({
  open,
  onOpenChange,
  settings,
  selectedYear,
  selectedMonth,
  onAddItem,
}: AddOrderDialogProps) {
  const [newItem, setNewItem] = useState(emptyItem);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64, 200, 0.6);
        setNewItem(prev => ({ ...prev, photo: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleSubmit = () => {
    if (newItem.productName.trim() && newItem.costPriceCNY > 0) {
      const orderDate = newItem.createdAt 
        ? newItem.createdAt 
        : new Date(selectedYear, selectedMonth - 1, 15).toISOString();
      
      onAddItem({
        ...newItem,
        completedAt: newItem.completedAt || orderDate,
        createdAt: orderDate,
      }, orderDate);
      
      setNewItem(emptyItem);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setNewItem(emptyItem);
    onOpenChange(false);
  };

  const calculatedCost = newItem.costPriceCNY > 0 
    ? Math.ceil(newItem.costPriceCNY * settings.exchangeRate + 1000) 
    : 0;
  
  const calculatedProfit = newItem.actualPayment > 0 && newItem.costPriceCNY > 0
    ? newItem.actualPayment - calculatedCost
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增訂單</DialogTitle>
          <DialogDescription>填寫商品資訊後點擊確定新增</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Photo Upload */}
          <div className="flex flex-col gap-2">
            <Label>商品照片（可拖曳上傳）</Label>
            <label 
              className={cn(
                "w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden",
                isDragging 
                  ? "border-primary bg-primary/10" 
                  : "border-primary/40 hover:border-primary"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {newItem.photo ? (
                <img src={newItem.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-8 h-8 text-primary/60" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          {/* Product Name */}
          <div className="grid gap-2">
            <Label htmlFor="productName">商品名稱 *</Label>
            <Input
              id="productName"
              value={newItem.productName}
              onChange={(e) => setNewItem(prev => ({ ...prev, productName: e.target.value }))}
              placeholder="請輸入商品名稱"
            />
          </div>

          {/* Color & Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="color">顏色</Label>
              <Input
                id="color"
                value={newItem.color}
                onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                placeholder="顏色"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">尺寸</Label>
              <Input
                id="size"
                value={newItem.size}
                onChange={(e) => setNewItem(prev => ({ ...prev, size: e.target.value }))}
                placeholder="尺寸"
              />
            </div>
          </div>

          {/* Cost Price */}
          <div className="grid gap-2">
            <Label htmlFor="costPrice">成本價格 (CNY) *</Label>
            <Input
              id="costPrice"
              type="number"
              value={newItem.costPriceCNY || ''}
              onChange={(e) => setNewItem(prev => ({ ...prev, costPriceCNY: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              min="0"
              step="0.01"
            />
            {newItem.costPriceCNY > 0 && (
              <p className="text-sm text-muted-foreground">
                換算+運費: <span className="font-medium text-foreground">¥{calculatedCost.toLocaleString()}</span>
              </p>
            )}
          </div>

          {/* Actual Payment */}
          <div className="grid gap-2">
            <Label htmlFor="actualPayment">實際入帳 (JPY)</Label>
            <Input
              id="actualPayment"
              type="number"
              value={newItem.actualPayment || ''}
              onChange={(e) => setNewItem(prev => ({ ...prev, actualPayment: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              min="0"
            />
            {newItem.actualPayment > 0 && newItem.costPriceCNY > 0 && (
              <p className="text-sm">
                預估利潤: <span className={cn(
                  "font-semibold",
                  calculatedProfit >= 0 ? "profit-positive" : "profit-negative"
                )}>
                  ¥{calculatedProfit.toLocaleString()}
                </span>
              </p>
            )}
          </div>

          {/* Order Date */}
          <div className="grid gap-2">
            <Label>訂單日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newItem.createdAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newItem.createdAt ? format(new Date(newItem.createdAt), 'yyyy/MM/dd') : `預設: ${selectedYear}年${selectedMonth}月`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newItem.createdAt ? new Date(newItem.createdAt) : undefined}
                  onSelect={(date) => setNewItem(prev => ({ ...prev, createdAt: date?.toISOString() || '' }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Completed Date */}
          <div className="grid gap-2">
            <Label>完成日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newItem.completedAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newItem.completedAt ? format(new Date(newItem.completedAt), 'yyyy/MM/dd') : '選擇完成日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newItem.completedAt ? new Date(newItem.completedAt) : undefined}
                  onSelect={(date) => setNewItem(prev => ({ ...prev, completedAt: date?.toISOString() || '' }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!newItem.productName.trim() || newItem.costPriceCNY <= 0}
          >
            確定新增
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
