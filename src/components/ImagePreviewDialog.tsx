import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onDelete?: () => void;
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  imageSrc,
  onDelete,
}: ImagePreviewDialogProps) {
  const handleDelete = () => {
    onDelete?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-2">
        <VisuallyHidden>
          <DialogTitle>圖片預覽</DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          <img 
            src={imageSrc} 
            alt="預覽" 
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
          />
          {onDelete && (
            <button
              onClick={handleDelete}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              刪除圖片
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
