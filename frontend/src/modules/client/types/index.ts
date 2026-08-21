export interface Product {
  productId: number;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  description: string;
  isAvailable: boolean;
  categoryId: number;
  categoryName: string;
}

export interface CategoryMenu {
  categoryId: number;
  categoryName: string;
  products: Product[];
}

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  productPrice: number;
  priceTotal: number;
  note?: string;
  productImageUrl?: string;
}

export interface Cart {
  tableSessionId: number;
  threadId: number;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

export interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
  priceProduct: number;
  priceTotal: number;
  note?: string;
  threadId: number;
  status?: 'COOKING' | 'SERVED' | 'PENDING' | 'CANCELLED';
  orderedAt?: string;
}

export interface PersonalOrder {
  tableSessionId: number;
  threadId: number;
  myTotal: number;
  myItems: OrderItem[];
}

export interface MasterTableOrder {
  tableId: number;
  tableName: string;
  tableSessionId: number;
  sessionStatus: string;
  totalPrice: number;
  openedAt?: string;
  allTableItems: OrderItem[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type RequestType = 'CALL_STAFF' | 'REQUEST_BILL' | 'REQUEST_PAYMENT' | 'WATER' | 'UTENSILS' | 'OTHER';

export interface TableInfo {
  tableId: number;
  tableName: string;
  tableSessionId: number;
  qrToken: string;
}
