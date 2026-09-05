export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  role?: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  description?: string | null;
  quantity: number;
  minThreshold: number;
  unitPrice: string;
  gstRate?: string | null;
  hsnCode?: string | null;
  location?: string | null;
  supplier?: string | null;
  lastUpdatedBy?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: string;
}

export interface StockTransaction {
  id: number;
  itemId?: number | null;
  itemSku: string;
  itemName: string;
  type: 'RESTOCK' | 'DISPATCH' | 'ADJUSTMENT' | 'INITIAL';
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  notes?: string | null;
  performedBy: string;
  timestamp: string;
}

export interface InventoryMetrics {
  totalItems: number;
  totalQuantity: number;
  totalValue: string;
  lowStockCount: number;
}
