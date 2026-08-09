// TypeScript Interfaces for Admin Portal & POS Operations

export interface RevenueSummary {
  totalRevenue: number;         // e.g. 15420000
  revenueGrowthPercent: number; // e.g. 12.5
  totalOrders: number;          // e.g. 62
  activeServingOrders: number;  // e.g. 14
  occupancyRate: number;        // e.g. 85
  avgOrderValue: number;        // e.g. 248000
}

export interface HourlyRevenuePoint {
  hour: string;     // e.g. "08:00", "12:00"
  revenue: number;  // e.g. 1250000
  orders: number;   // e.g. 8
}

export interface TopSellingProduct {
  rank: number;
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  quantitySold: number;
  totalRevenue: number;
  sharePercent: number; // e.g. 35%
}

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
}

export interface ToppingGroup {
  id: string;
  title: string;
  required: boolean;
  options: ToppingOption[];
}

export interface AdminMenuItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  imageUrl: string;
  description?: string;
  isAvailable: boolean; // Công tắc Tạm hết hàng / Còn hàng
  toppingGroups?: ToppingGroup[];
}

export type TableStatus = 'EMPTY' | 'OCCUPIED' | 'CALLING_STAFF' | 'BILL_REQUESTED';

export interface AdminTable {
  id: string;
  tableNumber: string; // e.g. "08"
  zone: string;        // e.g. "Tầng 1", "Tầng 2", "VIP"
  capacity: number;    // e.g. 4
  status: TableStatus;
  currentOrderCode?: string;
  occupiedMinutes?: number;
  totalAmount?: number;
  qrUrl: string;
}

export type StaffRole = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF' | 'KITCHEN';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  salary: number;      // Mức lương (VND)
  username: string;    // Tên đăng nhập
  password?: string;   // Mật khẩu
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

export type AdminOrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'PAID' | 'CANCELLED';

export interface AdminOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

export interface AdminOrder {
  id: string;
  orderCode: string;       // e.g. "#ORD-8821"
  tableNumber: string;     // e.g. "02"
  zone: string;            // e.g. "Tầng 1"
  createdAt: string;       // e.g. "12:45"
  status: AdminOrderStatus;
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod: 'CASH' | 'VIETQR' | 'UNPAID';
  totalAmount: number;
  items: AdminOrderItem[];
  customerNote?: string;
  staffName?: string;
}
