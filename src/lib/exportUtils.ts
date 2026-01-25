import ExcelJS from 'exceljs';
import { InventoryItem, OrderItem, Settings } from '@/types/inventory';

// Convert base64 to buffer for exceljs
function base64ToBuffer(base64: string): { buffer: ArrayBuffer; extension: 'png' | 'jpeg' } {
  // Extract the base64 data and mime type
  const matches = base64.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 image');
  }
  
  const mimeType = matches[1];
  const base64Data = matches[2];
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return {
    buffer: bytes.buffer,
    extension: mimeType === 'png' ? 'png' : 'jpeg'
  };
}

export async function exportInventoryToExcel(items: InventoryItem[], settings: Settings, storeName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('庫存管理');
  
  // Set column headers and widths
  worksheet.columns = [
    { header: '照片', key: 'photo', width: 15 },
    { header: '商品名稱', key: 'productName', width: 25 },
    { header: '顏色', key: 'color', width: 12 },
    { header: '尺寸', key: 'size', width: 10 },
    { header: '數量', key: 'quantity', width: 10 },
    { header: '成本 (CNY)', key: 'costPriceCNY', width: 15 },
    { header: '販賣價格 (JPY)', key: 'sellingPriceJPY', width: 18 },
  ];
  
  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  
  // Add data rows with images
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNumber = i + 2; // +2 because row 1 is header
    
    const row = worksheet.addRow({
      photo: '',
      productName: item.productName,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      costPriceCNY: item.costPriceCNY,
      sellingPriceJPY: item.sellingPriceJPY,
    });
    
    row.height = 60; // Set row height for images
    row.alignment = { vertical: 'middle' };
    
    // Add image if exists
    if (item.photo) {
      try {
        const { buffer, extension } = base64ToBuffer(item.photo);
        const imageId = workbook.addImage({
          buffer,
          extension,
        });
        
        worksheet.addImage(imageId, {
          tl: { col: 0, row: rowNumber - 1 },
          ext: { width: 80, height: 55 },
        });
      } catch (error) {
        console.warn('Failed to add image for item:', item.productName, error);
      }
    }
  }
  
  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `${storeName}_庫存_${date}.xlsx`);
}

export async function exportOrdersToExcel(orders: OrderItem[], storeName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('訂單管理');
  
  // Set column headers and widths
  worksheet.columns = [
    { header: '照片', key: 'photo', width: 15 },
    { header: '商品名稱', key: 'productName', width: 25 },
    { header: '顏色', key: 'color', width: 12 },
    { header: '尺寸', key: 'size', width: 10 },
    { header: '成本 (CNY)', key: 'costPriceCNY', width: 15 },
    { header: '換算後加運費 (JPY)', key: 'convertedWithShipping', width: 20 },
    { header: '實際入帳 (JPY)', key: 'actualPayment', width: 18 },
    { header: '利潤 (JPY)', key: 'profit', width: 15 },
    { header: '訂單日期', key: 'createdAt', width: 15 },
  ];
  
  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  
  // Add data rows with images
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const rowNumber = i + 2;
    
    const row = worksheet.addRow({
      photo: '',
      productName: order.productName,
      color: order.color,
      size: order.size,
      costPriceCNY: order.costPriceCNY,
      convertedWithShipping: order.convertedWithShipping,
      actualPayment: order.actualPayment,
      profit: order.profit,
      createdAt: order.createdAt ? new Date(order.createdAt).toLocaleDateString('ja-JP') : '',
    });
    
    row.height = 60;
    row.alignment = { vertical: 'middle' };
    
    // Color profit cells based on value
    const profitCell = row.getCell('profit');
    if (order.profit > 0) {
      profitCell.font = { color: { argb: 'FF22C55E' } }; // green
    } else if (order.profit < 0) {
      profitCell.font = { color: { argb: 'FFEF4444' } }; // red
    }
    
    // Add image if exists
    if (order.photo) {
      try {
        const { buffer, extension } = base64ToBuffer(order.photo);
        const imageId = workbook.addImage({
          buffer,
          extension,
        });
        
        worksheet.addImage(imageId, {
          tl: { col: 0, row: rowNumber - 1 },
          ext: { width: 80, height: 55 },
        });
      } catch (error) {
        console.warn('Failed to add image for order:', order.productName, error);
      }
    }
  }
  
  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `${storeName}_訂單_${date}.xlsx`);
}

// Keep CSV exports for backwards compatibility
export function exportToCSV(data: Record<string, unknown>[], filename: string, headers: { key: string; label: string }[]) {
  const csvHeaders = headers.map(h => h.label).join(',');
  const csvRows = data.map(row => 
    headers.map(h => {
      const value = row[h.key];
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );
  
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadBlob(blob, `${filename}.csv`);
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
