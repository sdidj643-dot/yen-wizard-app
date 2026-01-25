export interface InventoryItem {
  id: string;
  photo: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  costPriceCNY: number;
  sellingPriceJPY: number;
}

export interface OrderItem {
  id: string;
  photo: string;
  productName: string;
  color: string;
  size: string;
  costPriceCNY: number;
  convertedWithShipping: number;
  actualPayment: number;
  profit: number;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  inventory: InventoryItem[];
  orders: OrderItem[];
}

export interface Settings {
  exchangeRate: number; // CNY to JPY
  internationalShipping: number; // JPY
  domesticShipping: number; // JPY
  targetProfit: number; // JPY
  platformFeeRate: number; // percentage (0.22 = 22%)
}

export const defaultSettings: Settings = {
  exchangeRate: 23,
  internationalShipping: 1000,
  domesticShipping: 1000,
  targetProfit: 6000,
  platformFeeRate: 0.22,
};

// Calculate selling price from CNY cost
// Formula: ((CNY * rate) + intlShipping + domesticShipping + profit) / (1 - feeRate)
export function calculateSellingPrice(costCNY: number, settings: Settings): number {
  const baseCost = costCNY * settings.exchangeRate;
  const totalCost = baseCost + settings.internationalShipping + settings.domesticShipping + settings.targetProfit;
  const sellingPrice = totalCost / (1 - settings.platformFeeRate);
  return Math.ceil(sellingPrice);
}

// Calculate converted cost with shipping for orders
// Formula: (CNY * rate) + shipping
export function calculateConvertedWithShipping(costCNY: number, exchangeRate: number, shipping: number = 1000): number {
  return Math.ceil(costCNY * exchangeRate + shipping);
}

// Calculate profit from actual payment
export function calculateProfit(actualPayment: number, convertedWithShipping: number): number {
  return actualPayment - convertedWithShipping;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
