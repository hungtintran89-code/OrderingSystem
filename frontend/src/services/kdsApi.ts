import { KitchenOrder, OrderStatus, KdsHistoryLogItem } from '../types/kds';

// 🔔 Web Audio API Sound Alert Synthesizer (No external asset files needed)
export const playNewOrderSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Pleasant double-beep chime (High E5 -> A5)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    playNote(659.25, 0, 0.15); // E5
    playNote(880.00, 0.12, 0.25); // A5
  } catch (err) {
    console.warn('Web Audio Sound API blocked or unsupported:', err);
  }
};

// Initial Mock KDS Orders
const now = Date.now();

let initialKdsOrders: KitchenOrder[] = [
  {
    id: 'kds-101',
    orderCode: '#ORD-8821',
    tableName: 'Bàn 04 - Tầng 1',
    status: 'PENDING',
    createdAt: new Date(now - 18 * 60 * 1000).toISOString(), // 18 phút trước (URGENT - RED)
    items: [
      { id: 'i-1', name: 'Phở Bò Đặc Biệt (Bát Lớn)', quantity: 2, note: 'Ít hành, bánh phở mềm, cho nhiều nước dùng', category: 'soup', isCompleted: false },
      { id: 'i-2', name: 'Phở Gà Tái Nướng', quantity: 1, category: 'soup', isCompleted: false },
      { id: 'i-3', name: 'Quẩy Giòn Chiên Nóng', quantity: 4, category: 'other', isCompleted: false },
    ],
  },
  {
    id: 'kds-102',
    orderCode: '#ORD-8824',
    tableName: 'Bàn 12 - Tầng 2',
    status: 'IN_PROGRESS',
    createdAt: new Date(now - 9 * 60 * 1000).toISOString(), // 9 phút trước (WARNING - AMBER)
    items: [
      { id: 'i-4', name: 'Bò Nướng Tảng Sốt Tiêu Đen', quantity: 1, note: 'Chín vừa (Medium Rare), không ngò rí', category: 'grill', isCompleted: true },
      { id: 'i-5', name: 'Rau Củ Nướng Ngũ Vị', quantity: 1, category: 'grill', isCompleted: false },
      { id: 'i-6', name: 'Trà Chanh Giã Tay', quantity: 2, note: '70% đường, ít đá', category: 'drink', isCompleted: false },
    ],
  },
  {
    id: 'kds-103',
    orderCode: '#ORD-8829',
    tableName: 'Bàn 08 - Sân Thượng',
    status: 'PENDING',
    createdAt: new Date(now - 3 * 60 * 1000).toISOString(), // 3 phút trước (NEW - BLUE)
    items: [
      { id: 'i-7', name: 'Bún Bò Huế Đặc Biệt', quantity: 2, note: 'Không sa tế cay, cho thêm giò heo', category: 'soup', isCompleted: false },
      { id: 'i-8', name: 'Chả Cua Hấp Nóng', quantity: 1, category: 'other', isCompleted: false },
    ],
  },
];

let completedHistoryLog: KdsHistoryLogItem[] = [
  {
    id: 'hist-100',
    orderCode: '#ORD-8815',
    tableName: 'Bàn 01 - Tầng 1',
    completedAt: `${new Date(now - 25 * 60 * 1000).toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}`,
    prepDurationMinutes: 12,
    items: [
      { id: 'h1', name: 'Lẩu Thái Hải Sản Bát Đá', quantity: 1, note: 'Cay vừa', category: 'soup', isCompleted: true },
      { id: 'h2', name: 'Trà Đào Cam Sả', quantity: 2, category: 'drink', isCompleted: true },
    ],
  },
];

let lastBumpedTicket: KitchenOrder | null = null;

// Mock API Functions
export const fetchKitchenOrders = async (): Promise<KitchenOrder[]> => {
  await new Promise((res) => setTimeout(res, 300));
  return [...initialKdsOrders];
};

export const fetchKitchenHistoryLog = async (): Promise<KdsHistoryLogItem[]> => {
  await new Promise((res) => setTimeout(res, 200));
  return [...completedHistoryLog];
};

export const updateOrderStatusApi = async (orderId: string, newStatus: OrderStatus): Promise<KitchenOrder[]> => {
  const target = initialKdsOrders.find((o) => o.id === orderId);
  if (target) {
    if (newStatus === 'READY') {
      lastBumpedTicket = { ...target, status: 'READY' };
      const createdTime = new Date(target.createdAt).getTime();
      const prepMins = Math.max(1, Math.floor((Date.now() - createdTime) / (1000 * 60)));

      // Add to completed history log with timestamp
      completedHistoryLog.unshift({
        id: target.id,
        orderCode: target.orderCode,
        tableName: target.tableName,
        completedAt: `${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}`,
        prepDurationMinutes: prepMins,
        items: target.items.map((i) => ({ ...i, isCompleted: true })),
      });

      // Remove from active list
      initialKdsOrders = initialKdsOrders.filter((o) => o.id !== orderId);
    } else {
      target.status = newStatus;
    }
  }
  return [...initialKdsOrders];
};

export const toggleItemCompletionApi = async (orderId: string, itemId: string): Promise<KitchenOrder[]> => {
  initialKdsOrders = initialKdsOrders.map((order) => {
    if (order.id === orderId) {
      const updatedItems = order.items.map((item) =>
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
      );

      // Auto update status to IN_PROGRESS if at least 1 item checked
      let updatedStatus = order.status;
      const hasAnyCompleted = updatedItems.some((i) => i.isCompleted);
      if (hasAnyCompleted && order.status === 'PENDING') {
        updatedStatus = 'IN_PROGRESS';
      }

      return { ...order, items: updatedItems, status: updatedStatus };
    }
    return order;
  });
  return [...initialKdsOrders];
};

export const recallLastOrderApi = async (): Promise<{ orders: KitchenOrder[]; recalledTicket: KitchenOrder | null }> => {
  if (lastBumpedTicket) {
    const ticketToRestore = { ...lastBumpedTicket, status: 'IN_PROGRESS' as OrderStatus };
    initialKdsOrders.unshift(ticketToRestore);
    // Remove from history log if present
    completedHistoryLog = completedHistoryLog.filter((h) => h.id !== lastBumpedTicket?.id);
    lastBumpedTicket = null;
    return { orders: [...initialKdsOrders], recalledTicket: ticketToRestore };
  }
  return { orders: [...initialKdsOrders], recalledTicket: null };
};

export const recallSpecificOrderApi = async (historyId: string): Promise<KitchenOrder[]> => {
  const historyItem = completedHistoryLog.find((h) => h.id === historyId);
  if (historyItem) {
    const restoredTicket: KitchenOrder = {
      id: historyItem.id,
      orderCode: historyItem.orderCode,
      tableName: historyItem.tableName,
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      items: historyItem.items,
    };
    initialKdsOrders.unshift(restoredTicket);
    completedHistoryLog = completedHistoryLog.filter((h) => h.id !== historyId);
  }
  return [...initialKdsOrders];
};

// Function to simulate incoming new order from Client Dine-in App
export const createSimulatedOrder = (): KitchenOrder => {
  const tableNum = Math.floor(Math.random() * 15) + 1;
  const newOrder: KitchenOrder = {
    id: `kds-${Date.now()}`,
    orderCode: `#ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    tableName: `Bàn ${tableNum < 10 ? '0' + tableNum : tableNum}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: `sim-${Date.now()}-1`,
        name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
        quantity: 1,
        note: 'Sườn nướng chín tới, thêm mỡ hành',
        category: 'grill',
        isCompleted: false,
      },
      {
        id: `sim-${Date.now()}-2`,
        name: 'Canh Khổ Qua Dồn Thịt',
        quantity: 1,
        category: 'soup',
        isCompleted: false,
      },
    ],
  };
  initialKdsOrders.push(newOrder);
  playNewOrderSound();
  return newOrder;
};
