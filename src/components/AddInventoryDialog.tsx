import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Settings, calculateSellingPrice } from '@/types/inventory';
import { compressImage } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { ImagePreviewDialog } from './ImagePreviewDialog';
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

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onAddItem: (item: {
    photo: string;
    productName: string;
    color: string;
    size: string;
    quantity: number;
    costPriceCNY: number;
  }) => void;
}

const emptyItem = {
  photo: '',
  productName: '',
  color: '',
  size: '',
  quantity: 1,
  costPriceCNY: 0,
};

export function AddInventoryDialog({
  open,
  onOpenChange,
  settings,
  onAddItem,
}: AddInventoryDialogProps) {
  const [newItem, setNewItem] = useState(emptyItem);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
      onAddItem(newItem);
      setNewItem(emptyItem);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setNewItem(emptyItem);
    onOpenChange(false);
  };

  const calculatedSellingPrice = newItem.costPriceCNY > 0 
    ? calculateSellingPrice(newItem.costPriceCNY, settings)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增庫存</DialogTitle>
          <DialogDescription>填寫商品資訊後點擊確定新增</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Photo Upload */}
          <div className="flex flex-col gap-2">
            <Label>商品照片（可拖曳上傳）</Label>
            {newItem.photo ? (
              <div className="relative w-24 h-24 group">
                <img 
                  src={newItem.photo} 
                  alt="" 
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsPreviewOpen(true)}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewItem(prev => ({ ...prev, photo: '' }));
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
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
                <ImagePlus className="w-8 h-8 text-primary/60" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
            <ImagePreviewDialog
              open={isPreviewOpen}
              onOpenChange={setIsPreviewOpen}
              imageSrc={newItem.photo}
              onDelete={() => setNewItem(prev => ({ ...prev, photo: '' }))}
            />
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

          {/* Quantity */}
          <div className="grid gap-2">
            <Label htmlFor="quantity">數量</Label>
            <Input
              id="quantity"
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              min="1"
            />
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
                建議販賣價格: <span className="font-semibold text-primary">¥{calculatedSellingPrice.toLocaleString()}</span>
              </p>
            )}
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
