export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  note?: string;
  category?: 'grill' | 'soup' | 'drink' | 'other' | string;
  isCompleted?: boolean;
}

export interface KitchenOrder {
  id: string;
  orderCode: string;
  tableName: string;
  status: OrderStatus;
  createdAt: string; // ISO Date String
  items: KitchenOrderItem[];
}

export interface KdsHistoryLogItem {
  id: string;
  orderCode: string;
  tableName: string;
  createdAt?: string;
  completedAt: string; // Formatted time string
  completedTimestampMs?: number; // Exact timestamp in ms for live relative time ticking
  completedDateStr?: string; // YYYY-MM-DD for date filtering
  prepDurationMinutes: number;
  items: KitchenOrderItem[];
}

export type CategoryFilter = 'all' | 'grill' | 'soup' | 'drink';
