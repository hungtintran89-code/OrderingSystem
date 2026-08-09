export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY';

export interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  note?: string;
  category: 'grill' | 'soup' | 'drink' | 'other';
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
  completedAt: string; // Formatted time string
  prepDurationMinutes: number;
  items: KitchenOrderItem[];
}

export type CategoryFilter = 'all' | 'grill' | 'soup' | 'drink';
