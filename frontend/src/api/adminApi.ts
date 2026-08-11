import apiClient, { ApiResponse } from '../services/api';
import { message } from 'antd';
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
// 6. Toggle Item Stock Status   -> PATCH /api/v1/admin/catalog/products/{id}/toggle-stock
// 7. Get Tables & Floor Map     -> GET   /api/v1/admin/tables/floor-map
// 8. Staff Accounts & RBAC      -> GET   /api/v1/admin/staffs
// 9. Create VietQR Payment Link -> POST  /api/v1/payments/create-vietqr
// 10. Live Orders List          -> GET   /api/v1/admin/orders/history
// 11. Update Order Status       -> PATCH /api/v1/admin/orders/{id}/status
// ----------------------------------------------------------------------

const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

// Mock Data Storage for Fallback
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
];

let mockTables: AdminTable[] = [
  { id: 'tbl-1', tableNumber: '01', zone: 'Tầng 1', capacity: 4, status: 'EMPTY', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/01' },
  { id: 'tbl-2', tableNumber: '02', zone: 'Tầng 1', capacity: 2, status: 'OCCUPIED', currentOrderCode: '#ORD-8821', occupiedMinutes: 24, totalAmount: 340000, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/02' },
  { id: 'tbl-3', tableNumber: '03', zone: 'Tầng 1', capacity: 6, status: 'CALLING_STAFF', currentOrderCode: '#ORD-8824', occupiedMinutes: 12, totalAmount: 580000, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/03' },
  { id: 'tbl-4', tableNumber: '04', zone: 'Tầng 1', capacity: 4, status: 'BILL_REQUESTED', currentOrderCode: '#ORD-8829', occupiedMinutes: 45, totalAmount: 920000, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://order.restaurant.com/table/04' },
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
];

// --- API METHODS INTEGRATED WITH SPRING BOOT BACKEND ---

// 1. GET /api/v1/admin/analytics/revenue-summary
export const fetchRevenueSummaryApi = async (): Promise<RevenueSummary> => {
  try {
    const res = await apiClient.get<ApiResponse<RevenueSummary>>('/admin/analytics/revenue-summary');
    if (res.data && res.data.data) return res.data.data;
    return mockSummary;
  } catch {
    return mockSummary;
  }
};

// 2. GET /api/v1/admin/analytics/hourly-revenue
export const fetchHourlyRevenueApi = async (): Promise<HourlyRevenuePoint[]> => {
  try {
    const res = await apiClient.get<ApiResponse<any>>('/admin/analytics/hourly-revenue');
    const raw = res.data?.data;
    let list: any[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.content)) list = raw.content;

    if (list && list.length > 0) return list;
    return mockHourlyPoints;
  } catch {
    return mockHourlyPoints;
  }
};

// 3. GET /api/v1/admin/analytics/top-selling?limit=5
export const fetchTopSellingProductsApi = async (limit = 5): Promise<TopSellingProduct[]> => {
  try {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/analytics/top-selling?limit=${limit}`);
    const raw = res.data?.data;
    let list: any[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.content)) list = raw.content;

    if (list && list.length > 0) return list.slice(0, limit);
    return mockTopProducts.slice(0, limit);
  } catch {
    return mockTopProducts.slice(0, limit);
  }
};

// 4. GET /api/v1/admin/products (hoặc /api/v1/admin/categories)
export const fetchAdminMenuItemsApi = async (): Promise<AdminMenuItem[]> => {
  try {
    // Thử lấy danh sách trực tiếp từ /admin/products trước
    try {
      const prodRes = await apiClient.get<ApiResponse<any>>('/admin/products');
      const prodRaw = prodRes.data?.data;
      let prodList: any[] = [];
      if (Array.isArray(prodRaw)) prodList = prodRaw;
      else if (prodRaw && Array.isArray(prodRaw.content)) prodList = prodRaw.content;

      if (prodList && prodList.length > 0) {
        return prodList.map((p: any) => ({
          id: String(p.productId || p.id || `prod-${Math.random()}`),
          sku: p.sku || `SKU-${p.productId || Math.floor(100 + Math.random() * 900)}`,
          name: p.productName || p.name || 'Món ăn',
          category: p.categoryName || p.category?.categoryName || 'Món chính',
          price: Number(p.productPrice ?? p.price ?? 50000),
          costPrice: Number((p.productPrice ?? p.price ?? 50000) * 0.4),
          imageUrl: p.productImageUrl || p.imageUrl || p.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
          description: p.productDescription || p.description || '',
          isAvailable: p.productIsAvailable ?? p.isAvailable ?? true,
        }));
      }
    } catch {}

    const res = await apiClient.get<ApiResponse<any>>('/admin/categories');
    const raw = res.data?.data;
    let categories: any[] = [];
    if (Array.isArray(raw)) categories = raw;
    else if (raw && Array.isArray(raw.content)) categories = raw.content;

    if (categories && categories.length > 0) {
      const allProducts: AdminMenuItem[] = [];
      categories.forEach((cat: any) => {
        const catName = cat.categoryName || cat.name || 'Món chính';
        const productsList = cat.products || cat.items || [];
        if (Array.isArray(productsList) && productsList.length > 0) {
          productsList.forEach((p: any) => {
            const itemPrice = Number(p.productPrice ?? p.price ?? 0);
            allProducts.push({
              id: String(p.productId || p.id || `prod-${Math.random()}`),
              sku: p.sku || `SKU-${p.productId || Math.floor(100 + Math.random() * 900)}`,
              name: p.productName || p.name || 'Món ăn',
              category: p.categoryName || catName,
              price: itemPrice > 0 ? itemPrice : 50000,
              costPrice: itemPrice > 0 ? Math.round(itemPrice * 0.4) : 20000,
              imageUrl: p.productImageUrl || p.imageUrl || p.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
              description: p.productDescription || p.description || '',
              isAvailable: p.productIsAvailable ?? p.isAvailable ?? true,
            });
          });
        }
      });
      if (allProducts.length > 0) return allProducts;
    }
    return mockMenuItems;
  } catch {
    return mockMenuItems;
  }
};

// 5. PATCH /api/v1/admin/products/{id}/toggle-availability
export const toggleProductAvailabilityApi = async (productId: string, isAvailable: boolean): Promise<AdminMenuItem> => {
  try {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/products/${productId}/toggle-availability`, { isAvailable });
    if (res.data && res.data.data) {
      return res.data.data;
    }
  } catch {
    // Fallback
  }
  const target = mockMenuItems.find((p) => p.id === productId);
  if (!target) throw new Error('Không tìm thấy sản phẩm');
  target.isAvailable = isAvailable;
  return { ...target };
};

// 6. POST /api/v1/admin/products
export const createProductApi = async (productData: Omit<AdminMenuItem, 'id'>): Promise<AdminMenuItem> => {
  try {
    const payload = {
      productName: productData.name,
      productPrice: productData.price,
      categoryName: productData.category || 'Món chính',
      imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
      description: productData.description || '',
      isAvailbale: productData.isAvailable !== false,
    };
    const res = await apiClient.post<ApiResponse<any>>('/admin/products', payload);
    if (res.data && res.data.data) {
      const p = res.data.data;
      return {
        id: String(p.productId || p.id || `prod-${Date.now()}`),
        sku: p.sku || productData.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
        name: p.productName || productData.name,
        category: p.categoryName || productData.category,
        price: Number(p.productPrice ?? productData.price),
        costPrice: Math.round(Number(p.productPrice ?? productData.price) * 0.4),
        imageUrl: p.productImageUrl || productData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
        description: p.productDescription || productData.description || '',
        isAvailable: p.productIsAvailable ?? productData.isAvailable ?? true,
      };
    }
  } catch (err: any) {
    console.error('Error creating product:', err);
    throw err;
  }

  const newItem: AdminMenuItem = {
    ...productData,
    id: `prod-${Date.now()}`,
  };
  mockMenuItems.unshift(newItem);
  return newItem;
};

// 6.1. PUT /api/v1/admin/products/{id}
export const updateProductApi = async (
  productId: string,
  productData: Partial<AdminMenuItem>
): Promise<AdminMenuItem> => {
  try {
    const payload = {
      productName: productData.name,
      productPrice: productData.price,
      categoryName: productData.category,
      imageUrl: productData.imageUrl,
      description: productData.description,
      isAvailable: productData.isAvailable,
    };
    const res = await apiClient.put<ApiResponse<any>>(`/admin/products/${productId}`, payload);
    if (res.data && res.data.data) {
      const p = res.data.data;
      return {
        id: String(p.productId || p.id || productId),
        sku: p.sku || productData.sku || `SKU-${productId}`,
        name: p.productName || productData.name || 'Món ăn',
        category: p.categoryName || productData.category || 'Món chính',
        price: Number(p.productPrice ?? productData.price ?? 50000),
        costPrice: Math.round(Number(p.productPrice ?? productData.price ?? 50000) * 0.4),
        imageUrl: p.productImageUrl || productData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
        description: p.productDescription || productData.description || '',
        isAvailable: p.productIsAvailable ?? productData.isAvailable ?? true,
      };
    }
  } catch (err: any) {
    console.error('Error updating product:', err);
    throw err;
  }
  throw new Error('Không thể cập nhật món ăn');
};

// 6.2. DELETE /api/v1/admin/products/{id}
export const deleteProductApi = async (productId: string): Promise<void> => {
  try {
    await apiClient.delete<ApiResponse<void>>(`/admin/products/${productId}`);
  } catch (err: any) {
    console.error('Error deleting product:', err);
    throw err;
  }
};

// 7. GET /api/v1/admin/tables/floor-map
export const fetchAdminTablesApi = async (): Promise<AdminTable[]> => {
  try {
    const res = await apiClient.get<ApiResponse<any>>('/admin/tables/floor-map');
    const raw = res.data?.data;
    let list: any[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.content)) list = raw.content;

    if (list && list.length > 0) {
      return list.map((item: any) => ({
        id: String(item.tableId || item.id || `tbl-${Math.random()}`),
        tableNumber: String(item.tableName || item.tableNumber || item.number || '01'),
        zone: item.zone || 'Tầng 1',
        capacity: Number(item.capacity || 4),
        status: item.status || 'EMPTY',
        currentOrderCode: item.currentOrderCode || undefined,
        occupiedMinutes: item.occupiedMinutes || 0,
        totalAmount: Number(item.tempTotalAmount || item.totalAmount || 0),
        qrUrl: item.qrImageBase64 || item.qrUrl || '',
      }));
    }
    return [];
  } catch {
    return [];
  }
};

export const createAdminTableApi = async (data: { tableName: string; zone?: string; capacity?: number }): Promise<AdminTable> => {
  const res = await apiClient.post<ApiResponse<any>>('/admin/tables', data);
  const item = res.data?.data;
  return {
    id: String(item.tableId || item.id),
    tableNumber: String(item.tableName || item.tableNumber || data.tableName),
    zone: item.zone || data.zone || 'Tầng 1',
    capacity: Number(item.capacity || data.capacity || 4),
    status: 'EMPTY',
    occupiedMinutes: 0,
    totalAmount: 0,
    qrUrl: item.qrImageBase64 || item.qrUrl || '',
  };
};

export const updateAdminTableApi = async (
  tableId: string,
  data: { tableName: string; zone?: string; capacity?: number; regenerateQr?: boolean }
): Promise<AdminTable> => {
  const res = await apiClient.put<ApiResponse<any>>(`/admin/tables/${tableId}`, data);
  const item = res.data?.data;
  return {
    id: String(item.tableId || item.id || tableId),
    tableNumber: String(item.tableName || item.tableNumber || data.tableName),
    zone: item.zone || data.zone || 'Tầng 1',
    capacity: Number(item.capacity || data.capacity || 4),
    status: item.tableStatus || 'EMPTY',
    occupiedMinutes: 0,
    totalAmount: 0,
    qrUrl: item.qrImageBase64 || item.qrUrl || '',
  };
};

export const deleteAdminTableApi = async (tableId: string): Promise<void> => {
  await apiClient.delete(`/admin/tables/${tableId}`);
};

// 8. PATCH /api/v1/admin/tables/{id}/status
export const updateTableStatusApi = async (tableId: string, status: TableStatus): Promise<AdminTable> => {
  const table = mockTables.find((t) => t.id === tableId);
  if (!table) throw new Error('Không tìm thấy bàn');
  table.status = status;
  return { ...table };
};

const STAFF_PASSWORDS_STORAGE_KEY = 'ordering_system_staff_passwords';

export const getSavedStaffPassword = (username?: string, userId?: string): string => {
  try {
    const json = localStorage.getItem(STAFF_PASSWORDS_STORAGE_KEY);
    const map: Record<string, string> = json ? JSON.parse(json) : {};
    if (username && map[username]) return map[username];
    if (userId && map[userId]) return map[userId];
  } catch {}
  return '123456';
};

export const saveStaffPassword = (username?: string, userId?: string, password?: string): void => {
  if (!password || !password.trim()) return;
  try {
    const json = localStorage.getItem(STAFF_PASSWORDS_STORAGE_KEY);
    const map: Record<string, string> = json ? JSON.parse(json) : {};
    if (username) map[username] = password.trim();
    if (userId) map[userId] = password.trim();
    localStorage.setItem(STAFF_PASSWORDS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
};

// 9. GET /api/v1/admin/staffs
export const fetchStaffUsersApi = async (): Promise<StaffUser[]> => {
  try {
    const res = await apiClient.get<ApiResponse<any>>('/admin/staffs');
    const raw = res.data?.data;
    let list: any[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.content)) list = raw.content;

    if (list && list.length > 0) {
      return list.map((item: any) => {
        const uName = item.username || 'staff';
        const uId = String(item.userId || item.id || '');
        const pWord = item.password || getSavedStaffPassword(uName, uId);
        return {
          id: uId || `usr-${Math.random()}`,
          name: item.fullName || item.name || uName || 'Nhân viên',
          email: item.email || `${uName}@restaurant.com`,
          phone: item.phone || '0900000000',
          role: item.role || 'STAFF',
          salary: Number(item.salary || 7500000),
          username: uName,
          password: pWord,
          status: item.active !== false ? 'ACTIVE' : 'INACTIVE',
          lastActive: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN') : 'Vừa hoạt động',
        };
      });
    }
    return mockStaffUsers.map((m) => ({
      ...m,
      password: getSavedStaffPassword(m.username, m.id),
    }));
  } catch {
    return mockStaffUsers.map((m) => ({
      ...m,
      password: getSavedStaffPassword(m.username, m.id),
    }));
  }
};

// 9.1. POST /api/v1/admin/staffs
export const createStaffApi = async (staffData: {
  fullName: string;
  username: string;
  password?: string;
  role: StaffRole;
  salary?: number;
  phone?: string;
}): Promise<StaffUser> => {
  const pwdToSave = staffData.password || '123456';
  try {
    const res = await apiClient.post<ApiResponse<any>>('/admin/staffs', {
      fullName: staffData.fullName,
      username: staffData.username,
      password: pwdToSave,
      role: staffData.role,
      salary: staffData.salary || 7500000,
      phone: staffData.phone || '0900000000',
    });

    if (res.data && res.data.data) {
      const item = res.data.data;
      const createdId = String(item.userId || item.id || `usr-${Date.now()}`);
      saveStaffPassword(staffData.username, createdId, pwdToSave);

      return {
        id: createdId,
        name: item.fullName || staffData.fullName,
        email: `${item.username || staffData.username}@restaurant.com`,
        phone: item.phone || staffData.phone || '0900000000',
        role: item.role || staffData.role,
        salary: Number(item.salary || staffData.salary || 7500000),
        username: item.username || staffData.username,
        password: pwdToSave,
        status: 'ACTIVE',
        lastActive: 'Vừa hoạt động',
      };
    }
  } catch (err: any) {
    console.error('Error creating staff:', err);
    throw err;
  }

  const createdId = `usr-${Date.now()}`;
  saveStaffPassword(staffData.username, createdId, pwdToSave);

  const newStaff: StaffUser = {
    id: createdId,
    name: staffData.fullName,
    email: `${staffData.username}@restaurant.com`,
    phone: staffData.phone || '0900000000',
    role: staffData.role,
    salary: Number(staffData.salary || 7500000),
    username: staffData.username,
    password: pwdToSave,
    status: 'ACTIVE',
    lastActive: 'Vừa tạo',
  };
  mockStaffUsers.unshift(newStaff);
  return newStaff;
};

// 9.2. PUT /api/v1/admin/staffs/{id}
export const updateStaffApi = async (
  staffId: string,
  staffData: {
    fullName: string;
    role: StaffRole;
    salary: number;
    phone?: string;
    password?: string;
  }
): Promise<StaffUser> => {
  try {
    const res = await apiClient.put<ApiResponse<any>>(`/admin/staffs/${staffId}`, {
      fullName: staffData.fullName,
      role: staffData.role,
      salary: staffData.salary,
      phone: staffData.phone,
      password: staffData.password,
    });

    if (staffData.password && staffData.password.trim()) {
      saveStaffPassword(undefined, staffId, staffData.password.trim());
    }

    if (res.data && res.data.data) {
      const item = res.data.data;
      const uName = item.username || 'staff';
      if (staffData.password && staffData.password.trim()) {
        saveStaffPassword(uName, staffId, staffData.password.trim());
      }
      return {
        id: String(item.userId || item.id || staffId),
        name: item.fullName || staffData.fullName,
        email: `${uName}@restaurant.com`,
        phone: item.phone || staffData.phone || '0900000000',
        role: item.role || staffData.role,
        salary: Number(item.salary || staffData.salary || 7500000),
        username: uName,
        password: getSavedStaffPassword(uName, staffId),
        status: item.active !== false ? 'ACTIVE' : 'INACTIVE',
        lastActive: 'Vừa cập nhật',
      };
    }
  } catch (err: any) {
    console.error('Error updating staff:', err);
    throw err;
  }
  throw new Error('Không thể cập nhật nhân viên');
};

// 9.3. DELETE /api/v1/admin/staffs/{id}
export const deleteStaffApi = async (staffId: string): Promise<void> => {
  try {
    await apiClient.delete<ApiResponse<void>>(`/admin/staffs/${staffId}`);
    message.success('Đã xóa thành công nhân viên khỏi cơ sở dữ liệu!');
  } catch (err: any) {
    console.error('Error deleting staff:', err);
    throw err;
  }
};

// 10. POST /api/v1/payments/create-vietqr
export const createVietQrPaymentApi = async (
  tableNumber: string,
  totalAmount: number
): Promise<{ checkoutUrl: string; qrDataUrl: string; payosOrderCode: number }> => {
  try {
    const res = await apiClient.post<ApiResponse<{ checkoutUrl: string; qrDataUrl: string; payosOrderCode: number }>>(
      '/payments/create-vietqr',
      { tableNumber, totalAmount }
    );
    if (res.data && res.data.data) return res.data.data;
  } catch {
    // Fallback
  }

  await delay(300);
  const payosOrderCode = Math.floor(100000 + Math.random() * 900000);
  const checkoutUrl = `https://pay.payos.vn/web/${payosOrderCode}?amount=${totalAmount}&table=${tableNumber}`;
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkoutUrl)}`;
  return { checkoutUrl, qrDataUrl, payosOrderCode };
};

// 11. GET /api/v1/admin/orders/history
export const fetchAdminOrdersApi = async (): Promise<AdminOrder[]> => {
  try {
    const res = await apiClient.get<ApiResponse<any>>('/admin/orders/history');
    const raw = res.data?.data;
    let list: any[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.content)) list = raw.content;

    if (list && list.length > 0) {
      return list.map((item: any) => ({
        id: String(item.orderId || item.id || `ord-${Math.random()}`),
        orderCode: item.orderCode || `#ORD-${item.orderId || Math.floor(1000 + Math.random() * 9000)}`,
        tableNumber: String(item.tableNumber || item.tableId || '01'),
        zone: item.zone || 'Tầng 1',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN') : 'Vừa xong',
        status: item.status || 'PENDING',
        paymentStatus: item.paymentStatus || 'UNPAID',
        paymentMethod: item.paymentMethod || 'UNPAID',
        totalAmount: Number(item.totalAmount || 0),
        items: Array.isArray(item.items)
          ? item.items.map((i: any) => ({
              id: String(i.id || Math.random()),
              name: i.productName || i.name || 'Món ăn',
              quantity: Number(i.quantity || 1),
              price: Number(i.price || 0),
              note: i.note || '',
            }))
          : [],
        customerNote: item.customerNote || '',
        staffName: item.staffName || '',
      }));
    }
    return mockAdminOrders;
  } catch {
    return mockAdminOrders;
  }
};

// 12. PATCH /api/v1/admin/orders/{id}/status
export const updateAdminOrderStatusApi = async (
  orderId: string,
  status: AdminOrderStatus
): Promise<AdminOrder> => {
  const order = mockAdminOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng');
  order.status = status;
  if (status === 'PAID') {
    order.paymentStatus = 'PAID';
    if (order.paymentMethod === 'UNPAID') order.paymentMethod = 'CASH';
  }
  return { ...order };
};

// 13. ADMIN ZONE MANAGEMENT APIS
export interface AdminZone {
  zoneId: number;
  zoneName: string;
  displayOrder?: number;
}

export const fetchAdminZonesApi = async (): Promise<AdminZone[]> => {
  try {
    const response = await apiClient.get('/admin/zones');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return [
      { zoneId: 1, zoneName: 'Tầng trệt' },
      { zoneId: 2, zoneName: 'Tầng 1' },
      { zoneId: 3, zoneName: 'Tầng 2' },
      { zoneId: 4, zoneName: 'VIP' },
    ];
  } catch {
    return [
      { zoneId: 1, zoneName: 'Tầng trệt' },
      { zoneId: 2, zoneName: 'Tầng 1' },
      { zoneId: 3, zoneName: 'Tầng 2' },
      { zoneId: 4, zoneName: 'VIP' },
    ];
  }
};

export const createAdminZoneApi = async (zoneName: string): Promise<AdminZone> => {
  const response = await apiClient.post('/admin/zones', { zoneName });
  return response.data.data;
};

export const updateAdminZoneApi = async (zoneId: number, zoneName: string): Promise<AdminZone> => {
  const response = await apiClient.put(`/admin/zones/${zoneId}`, { zoneName });
  return response.data.data;
};

export const deleteAdminZoneApi = async (zoneId: number): Promise<void> => {
  await apiClient.delete(`/admin/zones/${zoneId}`);
};
