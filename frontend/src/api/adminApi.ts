import {
  RevenueSummary,
  HourlyRevenuePoint,
  TopSellingProduct,
  AdminMenuItem,
  AdminTable,
  StaffUser,
  TableStatus,
  AdminOrder,
  AdminOrderStatus
} from '../types/admin';

// ----------------------------------------------------------------------
// BACKEND DISCOVERY & API ENDPOINT MATCHING TABLE (Spring Boot Integration)
// ----------------------------------------------------------------------
// 1. Dashboard Revenue Summary  -> GET   /api/v1/admin/analytics/revenue-summary
// 2. Hourly Revenue Chart       -> GET   /api/v1/admin/analytics/hourly-revenue
// 3. Top Selling Products       -> GET   /api/v1/admin/analytics/top-selling?limit=5
// 4. Get All Menu Categories    -> GET   /api/v1/admin/categories
// 5. Create New Product         -> POST  /api/v1/admin/products
// 6. Toggle Item Stock Status   -> PATCH /api/v1/admin/products/{id}/toggle-availability
// 7. Get Tables & Floor Map     -> GET   /api/v1/admin/tables
// 8. Staff Accounts & RBAC      -> GET   /api/v1/admin/staff
// 9. Create VietQR Payment Link -> POST  /api/v1/payments/create-vietqr
// 10. Live Orders List          -> GET   /api/v1/admin/orders/history
// 11. Update Order Status       -> PATCH /api/v1/admin/orders/{id}/status
// ----------------------------------------------------------------------

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// Mock Data Storage
let mockSummary: RevenueSummary = {
  totalRevenue: 15420000,
  revenueGrowthPercent: 12.5,
  totalOrders: 62,
  activeServingOrders: 14,
  occupancyRate: 85,
  avgOrderValue: 248000,
};

let mockHourlyPoints: HourlyRevenuePoint[] = [
  { hour: '08:00', revenue: 650000, orders: 4 },
  { hour: '10:00', revenue: 1450000, orders: 8 },
  { hour: '12:00', revenue: 4200000, orders: 18 },
  { hour: '14:00', revenue: 2100000, orders: 9 },
  { hour: '16:00', revenue: 1800000, orders: 7 },
  { hour: '18:00', revenue: 3800000, orders: 14 },
  { hour: '20:00', revenue: 1420000, orders: 6 },
];

let mockTopProducts: TopSellingProduct[] = [
  {
    rank: 1,
    id: 'prod-1',
    name: 'Phở Bò Đặc Biệt (Bát Lớn)',
    category: 'Món nước',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=150&auto=format&fit=crop&q=80',
    quantitySold: 48,
    totalRevenue: 4080000,
    sharePercent: 32,
  },
  {
    rank: 2,
    id: 'prod-2',
    name: 'Bò Nướng Tảng Sốt Tiêu Đen',
    category: 'Món nướng',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80',
    quantitySold: 32,
    totalRevenue: 4480000,
    sharePercent: 28,
  },
  {
    rank: 3,
    id: 'prod-3',
    name: 'Bún Bò Huế Đặc Biệt',
    category: 'Món nước',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&auto=format&fit=crop&q=80',
    quantitySold: 28,
    totalRevenue: 2100000,
    sharePercent: 18,
  },
  {
    rank: 4,
    id: 'prod-4',
    name: 'Cơm Tấm Sườn Bì Chả',
    category: 'Món chính',
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=150&auto=format&fit=crop&q=80',
    quantitySold: 22,
    totalRevenue: 1540000,
    sharePercent: 12,
  },
  {
    rank: 5,
    id: 'prod-5',
    name: 'Trà Chanh Giã Tay HB',
    category: 'Đồ uống',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150&auto=format&fit=crop&q=80',
    quantitySold: 55,
    totalRevenue: 1375000,
    sharePercent: 10,
  },
];

let mockMenuItems: AdminMenuItem[] = [
  {
    id: 'prod-1',
    sku: 'SKU-PHO-01',
    name: 'Phở Bò Đặc Biệt (Bát Lớn)',
    category: 'Món nước',
    price: 85000,
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200&auto=format&fit=crop&q=80',
    description: 'Nước dùng ninh xương 24h, kèm thịt bò tái chín, nạm, gầu',
    isAvailable: true,
  },
  {
    id: 'prod-2',
    sku: 'SKU-BO-02',
    name: 'Bò Nướng Tảng Sốt Tiêu Đen',
    category: 'Món nướng',
    price: 140000,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80',
    description: 'Thịt bò Mỹ nướng mềm mọng nồng vị sốt tiêu đen thượng hạng',
    isAvailable: true,
  },
  {
    id: 'prod-3',
    sku: 'SKU-BUN-03',
    name: 'Bún Bò Huế Đặc Biệt',
    category: 'Món nước',
    price: 75000,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80',
    description: 'Đậm đà hương vị truyền thống Huế kèm chả cua & giò heo',
    isAvailable: false,
  },
  {
    id: 'prod-4',
    sku: 'SKU-COM-04',
    name: 'Cơm Tấm Sườn Bì Chả',
    category: 'Món chính',
    price: 70000,
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&auto=format&fit=crop&q=80',
    description: 'Sườn nướng mật ong thơm lừng, bì mềm chả trứng ướp vị đậm đà',
    isAvailable: true,
  },
];

let mockTables: AdminTable[] = [
  { id: 'tbl-1', tableNumber: '01', zone: 'Tầng 1', capacity: 4, status: 'EMPTY', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/01' },
  { id: 'tbl-2', tableNumber: '02', zone: 'Tầng 1', capacity: 2, status: 'OCCUPIED', currentOrderCode: '#ORD-8821', occupiedMinutes: 24, totalAmount: 340000, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/02' },
  { id: 'tbl-3', tableNumber: '03', zone: 'Tầng 1', capacity: 6, status: 'CALLING_STAFF', currentOrderCode: '#ORD-8824', occupiedMinutes: 12, totalAmount: 580000, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/03' },
  { id: 'tbl-4', tableNumber: '04', zone: 'Tầng 1', capacity: 4, status: 'BILL_REQUESTED', currentOrderCode: '#ORD-8829', occupiedMinutes: 45, totalAmount: 920000, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/04' },
  { id: 'tbl-5', tableNumber: '05', zone: 'Tầng 2', capacity: 4, status: 'EMPTY', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/05' },
  { id: 'tbl-6', tableNumber: '06', zone: 'VIP', capacity: 8, status: 'OCCUPIED', currentOrderCode: '#ORD-8835', occupiedMinutes: 18, totalAmount: 1850000, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/06' },
];

let mockStaffUsers: StaffUser[] = [
  { id: 'usr-1', name: 'Trần Văn Quản Lý', email: 'quanly@restaurant.com', phone: '0901234567', role: 'SUPER_ADMIN', salary: 15000000, username: 'admin_quanly', password: '••••••••', status: 'ACTIVE', lastActive: 'Vừa xong' },
  { id: 'usr-2', name: 'Nguyễn Văn Phục Vụ', email: 'phucvu@restaurant.com', phone: '0912345678', role: 'STAFF', salary: 7500000, username: 'staff_phucvu', password: '••••••••', status: 'ACTIVE', lastActive: '5 phút trước' },
  { id: 'usr-3', name: 'Lê Thị Thu Ngân', email: 'thungan@restaurant.com', phone: '0923456789', role: 'STAFF', salary: 8500000, username: 'pos_thungan', password: '••••••••', status: 'ACTIVE', lastActive: '12 phút trước' },
  { id: 'usr-4', name: 'Phạm Văn Bếp Trưởng', email: 'beptruong@restaurant.com', phone: '0934567890', role: 'KITCHEN', salary: 12000000, username: 'kds_beptruong', password: '••••••••', status: 'ACTIVE', lastActive: '1 phút trước' },
];

let mockAdminOrders: AdminOrder[] = [
  {
    id: 'ord-101',
    orderCode: '#ORD-8821',
    tableNumber: '02',
    zone: 'Tầng 1',
    createdAt: '12:45',
    status: 'PREPARING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'UNPAID',
    totalAmount: 340000,
    customerNote: 'Ít hành, bánh phở mềm, nước uống lấy sau',
    staffName: 'Khách tự quét QR',
    items: [
      { id: 'it-1', name: 'Phở Bò Đặc Biệt (Bát Lớn)', quantity: 2, price: 85000, note: 'Ít hành, bánh mềm' },
      { id: 'it-2', name: 'Quẩy Giòn Chiên Nóng', quantity: 2, price: 10000 },
      { id: 'it-3', name: 'Trà Chanh Giã Tay HB', quantity: 3, price: 50000, note: '70% đường, ít đá' },
    ],
  },
  {
    id: 'ord-102',
    orderCode: '#ORD-8824',
    tableNumber: '03',
    zone: 'Tầng 1',
    createdAt: '12:40',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'UNPAID',
    totalAmount: 580000,
    customerNote: 'Bò nướng chín vừa Medium Rare',
    staffName: 'Lê Thị Thu Ngân (POS)',
    items: [
      { id: 'it-4', name: 'Bò Nướng Tảng Sốt Tiêu Đen', quantity: 3, price: 140000, note: 'Chín vừa Medium Rare' },
      { id: 'it-5', name: 'Rau Củ Nướng Ngũ Vị', quantity: 2, price: 50000 },
      { id: 'it-6', name: 'Bia Thủ Công IPA', quantity: 3, price: 20000 },
    ],
  },
  {
    id: 'ord-103',
    orderCode: '#ORD-8829',
    tableNumber: '04',
    zone: 'Tầng 1',
    createdAt: '12:15',
    status: 'SERVED',
    paymentStatus: 'UNPAID',
    paymentMethod: 'UNPAID',
    totalAmount: 920000,
    customerNote: 'Không cay',
    staffName: 'Nguyễn Văn Phục Vụ',
    items: [
      { id: 'it-7', name: 'Bún Bò Huế Đặc Biệt', quantity: 4, price: 75000, note: 'Thêm giò heo' },
      { id: 'it-8', name: 'Cơm Tấm Sườn Bì Chả', quantity: 4, price: 70000 },
      { id: 'it-9', name: 'Nước Ép Dưa Hấu Tươi', quantity: 4, price: 85000 },
    ],
  },
  {
    id: 'ord-104',
    orderCode: '#ORD-8835',
    tableNumber: '06',
    zone: 'VIP',
    createdAt: '12:00',
    status: 'SERVED',
    paymentStatus: 'PAID',
    paymentMethod: 'VIETQR',
    totalAmount: 1850000,
    staffName: 'Khách tự quét QR',
    items: [
      { id: 'it-10', name: 'Lẩu Thái Hải Sản Thập Cẩm', quantity: 1, price: 850000, note: 'Cay vừa' },
      { id: 'it-11', name: 'Bò Nướng Tảng Sốt Tiêu Đen', quantity: 4, price: 140000 },
      { id: 'it-12', name: 'Trà Chanh Giã Tay HB', quantity: 8, price: 55000 },
    ],
  },
];

// --- API METHODS ---

// TODO: Sync with Backend Endpoint GET /api/v1/admin/analytics/revenue-summary
export const fetchRevenueSummaryApi = async (): Promise<RevenueSummary> => {
  await delay();
  return { ...mockSummary };
};

// TODO: Sync with Backend Endpoint GET /api/v1/admin/analytics/hourly-revenue
export const fetchHourlyRevenueApi = async (): Promise<HourlyRevenuePoint[]> => {
  await delay();
  return [...mockHourlyPoints];
};

// TODO: Sync with Backend Endpoint GET /api/v1/admin/analytics/top-selling?limit=5
export const fetchTopSellingProductsApi = async (limit = 5): Promise<TopSellingProduct[]> => {
  await delay();
  return mockTopProducts.slice(0, limit);
};

// TODO: Sync with Backend Endpoint GET /api/v1/admin/products
export const fetchAdminMenuItemsApi = async (): Promise<AdminMenuItem[]> => {
  await delay();
  return [...mockMenuItems];
};

// TODO: Sync with Backend Endpoint PATCH /api/v1/admin/products/{id}/toggle-availability
export const toggleProductAvailabilityApi = async (productId: string, isAvailable: boolean): Promise<AdminMenuItem> => {
  await delay(200);
  const target = mockMenuItems.find((p) => p.id === productId);
  if (!target) throw new Error('Không tìm thấy sản phẩm');
  target.isAvailable = isAvailable;
  return { ...target };
};

// TODO: Sync with Backend Endpoint POST /api/v1/admin/products
export const createProductApi = async (productData: Omit<AdminMenuItem, 'id'>): Promise<AdminMenuItem> => {
  await delay(500);
  const newItem: AdminMenuItem = {
    ...productData,
    id: `prod-${Date.now()}`,
  };
  mockMenuItems.unshift(newItem);
  return newItem;
};

// TODO: Sync with Backend Endpoint GET /api/v1/admin/tables
export const fetchAdminTablesApi = async (): Promise<AdminTable[]> => {
  await delay();
  return [...mockTables];
};

// TODO: Sync with Backend Endpoint PATCH /api/v1/admin/tables/{id}/status
export const updateTableStatusApi = async (tableId: string, status: TableStatus): Promise<AdminTable> => {
  await delay(300);
  const table = mockTables.find((t) => t.id === tableId);
  if (!table) throw new Error('Không tìm thấy bàn');
  table.status = status;
  return { ...table };
};

// TODO: Sync with Backend Endpoint GET /api/v1/admin/staff
export const fetchStaffUsersApi = async (): Promise<StaffUser[]> => {
  await delay();
  return [...mockStaffUsers];
};

// TODO: Sync with Backend Endpoint POST /api/v1/payments/create-vietqr
export const createVietQrPaymentApi = async (
  tableNumber: string,
  totalAmount: number
): Promise<{ checkoutUrl: string; qrDataUrl: string; payosOrderCode: number }> => {
  await delay(500);
  const payosOrderCode = Math.floor(100000 + Math.random() * 900000);
  const checkoutUrl = `https://pay.payos.vn/web/${payosOrderCode}?amount=${totalAmount}&table=${tableNumber}`;
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkoutUrl)}`;
  return { checkoutUrl, qrDataUrl, payosOrderCode };
};

// TODO: Sync with Backend Endpoint GET /api/v1/admin/orders/history
export const fetchAdminOrdersApi = async (): Promise<AdminOrder[]> => {
  await delay();
  return [...mockAdminOrders];
};

// TODO: Sync with Backend Endpoint PATCH /api/v1/admin/orders/{id}/status
export const updateAdminOrderStatusApi = async (
  orderId: string,
  status: AdminOrderStatus
): Promise<AdminOrder> => {
  await delay(300);
  const order = mockAdminOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng');
  order.status = status;
  if (status === 'PAID') {
    order.paymentStatus = 'PAID';
    if (order.paymentMethod === 'UNPAID') order.paymentMethod = 'CASH';
  }
  return { ...order };
};
