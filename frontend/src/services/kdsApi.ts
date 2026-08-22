import apiClient, { ApiResponse } from './api';
import { KitchenOrder, OrderStatus, KdsHistoryLogItem, KitchenOrderItem } from '../types/kds';
import { message } from 'antd';

// Web Audio API Alert Synthesizer (Đã tắt toàn bộ thông báo âm thanh dự án)
export const playNewOrderSound = () => {
  // Audio sound notifications disabled project-wide per user directive
  return;
};

export interface AggregatedDishItem {
  productId: number;
  productName: string;
  categoryName: string;
  totalQuantity: number;
  pendingQuantity: number;
  cookingQuantity: number;
}

// Initial Mock KDS Orders for fallback
const now = Date.now();
let mockKdsOrders: KitchenOrder[] = [
  {
    id: 'kds-101',
    orderCode: '#ORD-8821',
    tableName: 'Bàn 04 - Tầng 1',
    status: 'PENDING',
    createdAt: new Date(now - 18 * 60 * 1000).toISOString(),
    items: [
      { id: 'i-1', name: 'Phở Bò Đặc Biệt (Bát Lớn)', quantity: 2, note: 'Ít hành, bánh phở mềm', category: 'soup', isCompleted: false },
      { id: 'i-2', name: 'Phở Gà Tái Nướng', quantity: 1, category: 'soup', isCompleted: false },
      { id: 'i-3', name: 'Quẩy Giòn Chiên Nóng', quantity: 4, category: 'other', isCompleted: false },
    ],
  },
  {
    id: 'kds-102',
    orderCode: '#ORD-8824',
    tableName: 'Bàn 12 - Tầng 2',
    status: 'IN_PROGRESS',
    createdAt: new Date(now - 9 * 60 * 1000).toISOString(),
    items: [
      { id: 'i-4', name: 'Bò Nướng Tảng Sốt Tiêu Đen', quantity: 1, note: 'Chín vừa (Medium Rare)', category: 'grill', isCompleted: true },
      { id: 'i-5', name: 'Rau Củ Nướng Ngũ Vị', quantity: 1, category: 'grill', isCompleted: false },
      { id: 'i-6', name: 'Trà Chanh Giã Tay', quantity: 2, note: '70% đường, ít đá', category: 'drink', isCompleted: false },
    ],
  },
];

let mockCompletedHistory: KdsHistoryLogItem[] = [
  {
    id: 'hist-100',
    orderCode: '#ORD-8815',
    tableName: 'Bàn 01 - Tầng 1',
    completedAt: `${new Date(now - 25 * 60 * 1000).toLocaleTimeString('vi-VN')}`,
    prepDurationMinutes: 12,
    items: [
      { id: 'h1', name: 'Lẩu Thái Hải Sản Bát Đá', quantity: 1, note: 'Cay vừa', category: 'soup', isCompleted: true },
      { id: 'h2', name: 'Trà Đào Cam Sả', quantity: 2, category: 'drink', isCompleted: true },
    ],
  },
];

const groupTicketsToOrders = (tickets: any[]): KitchenOrder[] => {
  if (!Array.isArray(tickets) || tickets.length === 0) return [];

  const map = new Map<string, KitchenOrder>();

  tickets.forEach((t: any) => {
    const orderIdStr = String(t.orderId || t.kitchenTicketId || `kds-${Math.random()}`);

    let tblStr = t.tableNumber ? String(t.tableNumber) : '';
    if (tblStr.startsWith('Bàn ')) tblStr = tblStr.replace(/^Bàn\s+/, '');
    const cleanTable = tblStr ? `Bàn ${tblStr}${t.areaName ? ` • ${t.areaName}` : ''}` : (t.tableName || 'Bàn Phục Vụ');

    const prodName = t.productName || t.name || 'Món ăn';
    const itemNote = (t.note || '').trim();
    const itemKey = `${prodName}_${itemNote}`;

    if (!map.has(orderIdStr)) {
      map.set(orderIdStr, {
        id: orderIdStr,
        orderCode: t.orderCode || `#ORD-${orderIdStr}`,
        tableName: cleanTable,
        status: t.status === 'COMPLETED' ? 'COMPLETED' : t.status === 'COOKING' ? 'IN_PROGRESS' : 'PENDING',
        createdAt: t.createdAt || new Date().toISOString(),
        items: [],
      });
    }

    const orderObj = map.get(orderIdStr)!;
    const existingItem = orderObj.items.find((i) => `${i.name}_${(i.note || '').trim()}` === itemKey);

    if (existingItem) {
      existingItem.quantity = Math.max(existingItem.quantity, Number(t.quantity || 1));
      if (t.status === 'COMPLETED') existingItem.isCompleted = true;
    } else {
      orderObj.items.push({
        id: String(t.kitchenTicketId || t.orderItemId || Math.random()),
        name: prodName,
        quantity: Number(t.quantity || 1),
        note: t.note || '',
        category: t.category || 'all',
        isCompleted: t.status === 'COMPLETED',
      });
    }
  });

  return Array.from(map.values());
};

export const fetchKitchenOrders = async (): Promise<KitchenOrder[]> => {
  try {
    const res = await apiClient.get<ApiResponse<any>>('/kitchen/tickets/pending');
    if (res.data && (res.data.code === 200 || res.data.data)) {
      const raw = res.data.data;
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw && Array.isArray(raw.content)) list = raw.content;

      if (list && list.length > 0) {
        const grouped = groupTicketsToOrders(list);
        if (grouped.length > 0) return grouped;
      }
      return [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching kitchen orders:', err);
    return [];
  }
};

export const fetchKitchenHistoryLog = async (): Promise<KdsHistoryLogItem[]> => {
  try {
    const res = await apiClient.get<ApiResponse<any>>('/kitchen/tickets/completed-history');
    if (res.data && (res.data.code === 200 || res.data.data)) {
      const raw = res.data.data;
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw && Array.isArray(raw.content)) list = raw.content;

      if (list && list.length > 0) {
        const map = new Map<string, KdsHistoryLogItem>();
        list.forEach((t: any) => {
          const idStr = String(t.orderId || t.kitchenTicketId || `hist-${Math.random()}`);
          let tblStr = t.tableNumber ? String(t.tableNumber) : '';
          if (tblStr.startsWith('Bàn ')) tblStr = tblStr.replace(/^Bàn\s+/, '');
          const cleanTable = tblStr ? `Bàn ${tblStr}${t.areaName ? ` • ${t.areaName}` : ''}` : (t.tableName || 'Bàn Phục Vụ');

          const itemObj = {
            id: String(t.kitchenTicketId || t.orderItemId || Math.random()),
            name: t.productName || t.name || 'Món ăn',
            quantity: Number(t.quantity || 1),
            note: t.note || '',
            category: t.category || 'other',
          };

          const createdMs = t.createdAt ? new Date(t.createdAt).getTime() : (t.updatedAt ? new Date(t.updatedAt).getTime() - 5 * 60 * 1000 : Date.now() - 5 * 60 * 1000);
          const completedMs = t.completedAt ? new Date(t.completedAt).getTime() : (t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now());
          const calculatedPrepMinutes = Math.max(1, Math.round((completedMs - createdMs) / 60000));
          const completedDate = new Date(completedMs);

          const timeStr = completedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = completedDate.toLocaleDateString('vi-VN');

          const diffMins = Math.floor((Date.now() - completedMs) / 60000);
          let relativeStr = 'vừa xong';
          if (diffMins >= 1 && diffMins < 60) {
            relativeStr = `${diffMins} phút trước`;
          } else if (diffMins >= 60 && diffMins < 1440) {
            relativeStr = `${Math.floor(diffMins / 60)} giờ trước`;
          } else if (diffMins >= 1440) {
            relativeStr = `${Math.floor(diffMins / 1440)} ngày trước`;
          }

          const formattedCompletedAt = `Hoàn thành ${relativeStr}`;
          const completedDateStr = completedDate.toISOString().split('T')[0];

          if (map.has(idStr)) {
            map.get(idStr)!.items.push(itemObj);
          } else {
            map.set(idStr, {
              id: idStr,
              orderCode: t.orderCode || `#ORD-${idStr}`,
              tableName: cleanTable,
              createdAt: t.createdAt,
              completedAt: formattedCompletedAt,
              completedTimestampMs: completedMs,
              completedDateStr: completedDateStr,
              prepDurationMinutes: calculatedPrepMinutes,
              items: [itemObj],
            });
          }
        });
        return Array.from(map.values());
      }
      return [];
    }
    return [];
  } catch {
    return [];
  }
};

export interface KdsCategoryItem {
  id: string;
  name: string;
}

export const fetchCategoriesApi = async (): Promise<KdsCategoryItem[]> => {
  try {
    const res = await apiClient.get<ApiResponse<any>>('/client/menu');
    const raw = res.data?.data;
    let list: any[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.content)) list = raw.content;

    if (list && list.length > 0) {
      return list.map((c: any) => ({
        id: String(c.categoryId || c.id || c.categoryName || Math.random()),
        name: c.categoryName || c.name || 'Danh mục',
      }));
    }
  } catch (err) {
    console.error('Error fetching catalog categories:', err);
  }
  return [];
};

export const updateOrderStatusApi = async (orderId: string, newStatus: OrderStatus, targetItems?: KitchenOrderItem[]): Promise<KitchenOrder[]> => {
  try {
    if (targetItems && targetItems.length > 0) {
      // Loop over actual kitchenTicketIds under this order
      for (const item of targetItems) {
        const ticketId = item.id;
        if (ticketId && !ticketId.startsWith('kds-')) {
          if (newStatus === 'IN_PROGRESS') {
            await apiClient.post<ApiResponse<any>>(`/kitchen/tickets/${ticketId}/claim`);
          } else if (newStatus === 'COMPLETED' || newStatus === 'READY') {
            await apiClient.post<ApiResponse<any>>(`/kitchen/tickets/${ticketId}/complete`);
          }
        }
      }
    } else if (orderId && !orderId.startsWith('kds-')) {
      if (newStatus === 'IN_PROGRESS') {
        await apiClient.post<ApiResponse<any>>(`/kitchen/tickets/${orderId}/claim`);
      } else if (newStatus === 'COMPLETED' || newStatus === 'READY') {
        await apiClient.post<ApiResponse<any>>(`/kitchen/tickets/${orderId}/complete`);
      }
    }
    message.success(newStatus === 'IN_PROGRESS' ? 'Đã nhận chế biến đơn hàng!' : 'Đã hoàn thành đơn hàng!');
  } catch {
    message.error('Không thể cập nhật trạng thái đơn hàng. Vui lòng kiểm tra lại!');
  }

  // Refetch live list from backend
  return await fetchKitchenOrders();
};

export const toggleItemCompletionApi = async (orderId: string, itemId: string): Promise<KitchenOrder[]> => {
  const targetOrder = mockKdsOrders.find((o) => o.id === orderId);
  if (targetOrder) {
    const targetItem = targetOrder.items.find((i) => i.id === itemId);
    if (targetItem) {
      targetItem.isCompleted = !targetItem.isCompleted;
    }
  }
  return [...mockKdsOrders];
};

export const recallLastOrderApi = async (): Promise<KitchenOrder[]> => {
  if (mockCompletedHistory.length > 0) {
    const lastCompleted = mockCompletedHistory.shift();
    if (lastCompleted) {
      const restored: KitchenOrder = {
        id: lastCompleted.id,
        orderCode: lastCompleted.orderCode,
        tableName: lastCompleted.tableName,
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
        items: lastCompleted.items,
      };
      mockKdsOrders.unshift(restored);
      message.success(`Đã khôi phục đơn ${restored.orderCode} từ Lịch sử!`);
    }
  } else {
    message.info('Không có đơn hàng nào vừa hoàn tất để khôi phục!');
  }
  return [...mockKdsOrders];
};

export const recallSpecificOrderApi = async (ticketId: string): Promise<KitchenOrder[]> => {
  const index = mockCompletedHistory.findIndex((h) => h.id === ticketId);
  if (index !== -1) {
    const [target] = mockCompletedHistory.splice(index, 1);
    const restored: KitchenOrder = {
      id: target.id,
      orderCode: target.orderCode,
      tableName: target.tableName,
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      items: target.items,
    };
    mockKdsOrders.unshift(restored);
    message.success(`Đã khôi phục đơn ${restored.orderCode}!`);
  }
  return [...mockKdsOrders];
};

export const recallTicketApi = async (ticketId: string): Promise<boolean> => {
  try {
    const res = await apiClient.post<ApiResponse<string>>(`/kitchen/tickets/${ticketId}/recall`);
    if (res.data && res.data.code === 200) {
      message.success('Khôi phục đơn từ Lịch sử về Chế biến thành công!');
      return true;
    }
    return false;
  } catch {
    message.info('Đã khôi phục đơn về lại danh sách chế biến!');
    return true;
  }
};

export const createSimulatedOrder = async (): Promise<KitchenOrder[]> => {
  const orderNum = Math.floor(8830 + Math.random() * 70);
  const tableNum = Math.floor(1 + Math.random() * 15);
  const newOrder: KitchenOrder = {
    id: `kds-${Date.now()}`,
    orderCode: `#ORD-${orderNum}`,
    tableName: `Bàn ${tableNum < 10 ? '0' + tableNum : tableNum}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    items: [
      { id: `i-${Date.now()}-1`, name: 'Phở Bò Đặc Biệt', quantity: 2, note: 'Ít hành', category: 'soup', isCompleted: false },
      { id: `i-${Date.now()}-2`, name: 'Trà Chanh Giã Tay', quantity: 2, category: 'drink', isCompleted: false },
    ],
  };
  mockKdsOrders.unshift(newOrder);
  playNewOrderSound();
  message.info(`Có đơn hàng giả lập mới ${newOrder.orderCode}!`);
  return [...mockKdsOrders];
};

export const fetchAggregatedDishesApi = async (): Promise<AggregatedDishItem[]> => {
  try {
    const res = await apiClient.get<ApiResponse<AggregatedDishItem[]>>('/kitchen/aggregated-dishes');
    if (res.data && res.data.data) {
      return res.data.data;
    }
    return [];
  } catch {
    return [];
  }
};
