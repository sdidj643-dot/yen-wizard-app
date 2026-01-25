import { InventoryItem, OrderItem, Settings } from '@/types/inventory';

export function exportToCSV(data: Record<string, unknown>[], filename: string, headers: { key: string; label: string }[]) {
  const csvHeaders = headers.map(h => h.label).join(',');
  const csvRows = data.map(row => 
    headers.map(h => {
      const value = row[h.key];
      // Escape quotes and wrap in quotes if contains comma or quote
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );
  
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadBlob(blob, `${filename}.csv`);
}

export function exportInventoryToCSV(items: InventoryItem[], settings: Settings, storeName: string) {
  const headers = [
    { key: 'productName', label: '商品名稱' },
    { key: 'color', label: '顏色' },
    { key: 'size', label: '尺寸' },
    { key: 'quantity', label: '數量' },
    { key: 'costPriceCNY', label: '成本 (CNY)' },
    { key: 'sellingPriceJPY', label: '販賣價格 (JPY)' },
  ];
  
  const data = items.map(item => ({
    productName: item.productName,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
    costPriceCNY: item.costPriceCNY,
    sellingPriceJPY: item.sellingPriceJPY,
  }));
  
  const date = new Date().toISOString().split('T')[0];
  exportToCSV(data, `${storeName}_庫存_${date}`, headers);
}

export function exportOrdersToCSV(orders: OrderItem[], storeName: string) {
  const headers = [
    { key: 'productName', label: '商品名稱' },
    { key: 'color', label: '顏色' },
    { key: 'size', label: '尺寸' },
    { key: 'costPriceCNY', label: '成本 (CNY)' },
    { key: 'convertedWithShipping', label: '換算後加運費 (JPY)' },
    { key: 'actualPayment', label: '實際入帳 (JPY)' },
    { key: 'profit', label: '利潤 (JPY)' },
    { key: 'createdAt', label: '日期' },
  ];
  
  const data = orders.map(order => ({
    productName: order.productName,
    color: order.color,
    size: order.size,
    costPriceCNY: order.costPriceCNY,
    convertedWithShipping: order.convertedWithShipping,
    actualPayment: order.actualPayment,
    profit: order.profit,
    createdAt: order.createdAt ? new Date(order.createdAt).toLocaleDateString('ja-JP') : '',
  }));
  
  const date = new Date().toISOString().split('T')[0];
  exportToCSV(data, `${storeName}_訂單_${date}`, headers);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
