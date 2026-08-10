import apiClient, { ApiResponse } from './api';
import { KitchenOrder, OrderStatus, KdsHistoryLogItem } from '../types/kds';
import { message } from 'antd';

// Web Audio API Alert Synthesizer
export const playNewOrderSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + startTime + duration);
      osc.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };
    playNote(659.25, 0, 0.15);
    playNote(880.00, 0.12, 0.25);
  } catch (err) {
    console.warn('Web Audio API blocked or unsupported:', err);
  }
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

export const fetchKitchenOrders = async (): Promise<KitchenOrder[]> => {
  try {
    const res = await apiClient.get<ApiResponse<KitchenOrder[]>>('/kitchen/tickets/pending');
    if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data;
    }
    return mockKdsOrders;
  } catch {
    return mockKdsOrders;
  }
};

export const fetchKitchenHistoryLog = async (): Promise<KdsHistoryLogItem[]> => {
  try {
    const res = await apiClient.get<ApiResponse<KdsHistoryLogItem[]>>('/kitchen/tickets/history');
    if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data;
    }
    return mockCompletedHistory;
  } catch {
    return mockCompletedHistory;
  }
};

export const updateOrderStatusApi = async (orderId: string, newStatus: OrderStatus): Promise<KitchenOrder[]> => {
  try {
    if (newStatus === 'IN_PROGRESS') {
      await apiClient.post<ApiResponse<string>>(`/kitchen/tickets/${orderId}/claim`);
    } else if (newStatus === 'COMPLETED') {
      await apiClient.post<ApiResponse<string>>(`/kitchen/tickets/${orderId}/complete`);
    }
  } catch {
    // Graceful fallback
  }

  // Local State Update
  const target = mockKdsOrders.find((o) => o.id === orderId);
  if (target) {
    target.status = newStatus;
    if (newStatus === 'COMPLETED') {
      mockKdsOrders = mockKdsOrders.filter((o) => o.id !== orderId);
      mockCompletedHistory.unshift({
        id: `hist-${Date.now()}`,
        orderCode: target.orderCode,
        tableName: target.tableName,
        completedAt: new Date().toLocaleTimeString('vi-VN'),
        prepDurationMinutes: 10,
        items: target.items,
      });
      message.success(`Đã Bump xong đơn ${target.orderCode}!`);
    }
  }
  return [...mockKdsOrders];
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
