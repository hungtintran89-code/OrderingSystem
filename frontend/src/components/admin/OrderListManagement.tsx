import React, { useState, useEffect } from 'react';
import { AdminOrder, AdminOrderStatus } from '../../types/admin';
import { fetchAdminOrdersApi, updateAdminOrderStatusApi } from '../../api/adminApi';
import { wsService } from '../../modules/client/services/websocket';
import {
  Receipt,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ChefHat,
  Utensils,
  Ban,
  LayoutGrid,
  List,
  User,
  Sparkles,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Modal, message, Popconfirm } from 'antd';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDetailedOrderTime = (isoString?: string) => {
  if (!isoString) return { time: '--:--', date: '' };
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return { time: isoString, date: '' };
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return {
      time: `${hours}:${mins}`,
      date: `${day}/${month}`,
    };
  } catch {
    return { time: '--:--', date: '' };
  }
};

const groupOrdersBySession = (rawOrders: AdminOrder[]): AdminOrder[] => {
  if (!Array.isArray(rawOrders) || rawOrders.length === 0) return [];

  const takeawayOrders: AdminOrder[] = [];
  const tableSessionMap = new Map<string, AdminOrder[]>();

  for (const ord of rawOrders) {
    const isTakeaway = ord.orderType === 'TAKEAWAY' || (ord.tableNumber || '').toLowerCase().includes('mang');
    if (isTakeaway) {
      takeawayOrders.push(ord);
    } else {
      const groupKey = ord.tableSessionId ? `session_${ord.tableSessionId}` : `table_${ord.tableNumber || ord.id}`;
      if (!tableSessionMap.has(groupKey)) {
        tableSessionMap.set(groupKey, []);
      }
      tableSessionMap.get(groupKey)!.push(ord);
    }
  }

  const consolidatedDineInOrders: AdminOrder[] = [];

  for (const [key, batchList] of tableSessionMap.entries()) {
    if (batchList.length === 1) {
      consolidatedDineInOrders.push(batchList[0]);
    } else {
      const primary = batchList[0];

      // Gom toàn bộ món ăn từ các đợt gọi của phiên bàn
      const allItemsRaw = batchList.flatMap((b) => b.items || []);
      const groupedItemsMap = new Map<string, any>();
      for (const it of allItemsRaw) {
        const itemKey = `${(it.name || '').trim()}__${(it.note || '').trim()}`;
        if (groupedItemsMap.has(itemKey)) {
          const existing = groupedItemsMap.get(itemKey)!;
          existing.quantity += Number(it.quantity || 1);
        } else {
          groupedItemsMap.set(itemKey, { ...it, quantity: Number(it.quantity || 1) });
        }
      }
      const mergedItems = Array.from(groupedItemsMap.values());

      // Cộng tổng số tiền chuẩn 100% của toàn bộ các đợt món
      const grandTotal = mergedItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);

      // Trạng thái ưu tiên: PENDING > PREPARING > SERVED > PAID > CANCELLED
      let status: AdminOrderStatus = 'PAID';
      if (batchList.some((b) => b.status === 'PENDING')) status = 'PENDING';
      else if (batchList.some((b) => b.status === 'PREPARING')) status = 'PREPARING';
      else if (batchList.some((b) => b.status === 'SERVED')) status = 'SERVED';
      else if (batchList.some((b) => b.status === 'CANCELLED')) status = 'CANCELLED';

      const paidBatch = batchList.find((b) => b.paymentStatus === 'PAID') || primary;

      consolidatedDineInOrders.push({
        ...primary,
        items: mergedItems,
        totalAmount: grandTotal,
        status: status,
        paymentMethod: paidBatch.paymentMethod,
        paymentStatus: paidBatch.paymentStatus,
      });
    }
  }

  return [...consolidatedDineInOrders, ...takeawayOrders].sort((a, b) => {
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tB - tA;
  });
};

export const OrderListManagement: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | 'ALL'>('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  // Expanded Row State for Accordion Table View
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Selected Order Modal State
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadOrders = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);
      const data = await fetchAdminOrdersApi(
        undefined,
        startDateInput && endDateInput ? undefined : selectedDate,
        startDateInput || undefined,
        endDateInput || undefined
      );
      setOrders(data);
    } catch (err) {
      if (showSpinner) setError('Không thể tải danh sách đơn hàng phục vụ. Vui lòng thử lại.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(true);

    // 1. STOMP Realtime Subscriber: Auto update live orders list when customer places an order or completes payment
    const unsubKitchen = wsService.subscribe('/topic/kitchen/orders', () => loadOrders(false));
    const unsubFloorMap = wsService.subscribe('/topic/tables/floor-map', () => loadOrders(false));
    const unsubAdminAlerts = wsService.subscribe('/topic/admin/tables/alerts', () => loadOrders(false));
    const unsubAdminOrders = wsService.subscribe('/topic/admin/orders', () => loadOrders(false));

    // 2. Dual-Layer Auto-Polling (15s Interval for High-Responsiveness Guarantee)
    const pollInterval = setInterval(() => {
      loadOrders(false);
    }, 15000);

    return () => {
      unsubKitchen();
      unsubFloorMap();
      unsubAdminAlerts();
      unsubAdminOrders();
      clearInterval(pollInterval);
    };
  }, [selectedDate, startDateInput, endDateInput]);

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleUpdateStatus = async (orderId: string, newStatus: AdminOrderStatus) => {
    try {
      const updated = await updateAdminOrderStatusApi(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      message.success('Đã cập nhật trạng thái đơn hàng thành công!');
    } catch (err) {
      message.error('Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const handleOpenDetailModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // Clean, high-contrast, non-emoji badges
  const getStatusBadge = (status: AdminOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Chờ Bếp duyệt', style: 'bg-amber-50 text-amber-800 border-amber-200 font-medium' };
      case 'PREPARING':
        return { label: 'Bếp đang làm', style: 'bg-orange-50 text-orange-800 border-orange-200 font-medium' };
      case 'SERVED':
        return { label: 'Đã lên món', style: 'bg-blue-50 text-blue-800 border-blue-200 font-medium' };
      case 'PAID':
        return { label: 'Đã hoàn tất', style: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' };
      case 'CANCELLED':
        return { label: 'Đã hủy', style: 'bg-rose-50 text-rose-700 border-rose-200 font-medium' };
      default:
        return { label: status, style: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const getPaymentMethodBadge = (method?: string, paymentStatus?: string) => {
    if (paymentStatus === 'UNPAID' || method === 'UNPAID') {
      return { label: 'Chưa thanh toán', style: 'bg-amber-50 text-amber-700 border-amber-200 font-medium' };
    }
    if (method === 'VIETQR' || method === 'PAYOS_QR') {
      return { label: 'Chuyển khoản VietQR', style: 'bg-blue-50 text-blue-700 border-blue-200 font-medium' };
    }
    if (method === 'CASH') {
      return { label: 'Tiền mặt', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium' };
    }
    return { label: 'Tiền mặt', style: 'bg-slate-100 text-slate-700 border-slate-200 font-medium' };
  };

  const safeOrdersList = Array.isArray(orders) ? orders : [];

  // Counts for tabs
  const getCountByStatus = (status: AdminOrderStatus | 'ALL') => {
    if (status === 'ALL') return safeOrdersList.length;
    return safeOrdersList.filter((o) => o.status === status).length;
  };

  // Filtered & Grouped Orders
  const rawFiltered = safeOrdersList.filter((ord) => {
    const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
    const isTakeaway = ord.orderType === 'TAKEAWAY' || (ord.tableNumber || '').toLowerCase().includes('mang');
    const matchesOrderType =
      orderTypeFilter === 'ALL' ||
      (orderTypeFilter === 'TAKEAWAY' && isTakeaway) ||
      (orderTypeFilter === 'DINE_IN' && !isTakeaway);
    const matchesSearch =
      (ord.orderCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.tableNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(ord.items) && ord.items.some((it) => (it.name || '').toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesStatus && matchesOrderType && matchesSearch;
  });

  const filteredOrders = groupOrdersBySession(rawFiltered);

  return (
    <div className="space-y-4 font-sans w-full">
      {/* 1. TOPBAR & LIVE REALTIME HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Header Title & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-orange-600 stroke-[2.2] flex-shrink-0" />
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-base text-slate-900 tracking-tight">Danh Sách Đơn Hàng Realtime</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Realtime
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4 text-orange-600" />
                <span>Bảng</span>
              </button>
              <button
                onClick={() => setViewMode('GRID')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-orange-600" />
                <span>Lưới thẻ</span>
              </button>
            </div>

            <button
              onClick={() => loadOrders()}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* BỘ LỌC CHUYÊN NGHIỆP: HÀNG 1 - TÌM KIẾM & BỘ LỌC LOẠI ĐƠN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Ô TÌM KIẾM NỔI BẬT */}
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, số bàn, tên món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50/80 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* CHỌN LOẠI ĐƠN HÀNG (SEGMENTED CONTROL) */}
          <div className="lg:col-span-6 flex flex-wrap items-center justify-start lg:justify-end gap-2 text-xs">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mr-1">Loại đơn:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setOrderTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  orderTypeFilter === 'ALL'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả loại đơn
              </button>
              <button
                onClick={() => setOrderTypeFilter('DINE_IN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  orderTypeFilter === 'DINE_IN'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ăn tại quán
              </button>
              <button
                onClick={() => setOrderTypeFilter('TAKEAWAY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  orderTypeFilter === 'TAKEAWAY'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mang về
              </button>
            </div>
          </div>
        </div>

        {/* BỘ LỌC CHUYÊN NGHIỆP: HÀNG 2 - THỜI GIAN (LỌC NHANH & TỪ NGÀY ĐẾN NGÀY) */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* CỤM NÚT CHỌN NHANH NGÀY */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-orange-600" /> Thời gian:
            </span>
            <button
              onClick={() => {
                setStartDateInput('');
                setEndDateInput('');
                setSelectedDate(getTodayString());
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                selectedDate === getTodayString() && !startDateInput
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => {
                setStartDateInput('');
                setEndDateInput('');
                setSelectedDate(getYesterdayString());
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                selectedDate === getYesterdayString() && !startDateInput
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Hôm qua
            </button>
            <button
              onClick={() => {
                setStartDateInput('');
                setEndDateInput('');
                setSelectedDate('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                selectedDate === 'ALL' && !startDateInput
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tất cả ngày
            </button>
          </div>

          {/* CỤM CHỌN KHOẢNG NGÀY TRỰC QUAN */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-bold">Từ:</span>
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
              />
            </div>
            <span className="text-slate-300 font-bold">→</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-bold">Đến:</span>
              <input
                type="date"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
              />
            </div>
            {(startDateInput || endDateInput) && (
              <button
                onClick={() => {
                  setStartDateInput('');
                  setEndDateInput('');
                  setSelectedDate(getTodayString());
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 transition-all cursor-pointer ml-1"
              >
                Xóa khoảng ngày
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 UI STATES HANDLING */}

      {/* STATE 2: LOADING SKELETON */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-14 bg-slate-100 rounded-xl w-full"></div>
          ))}
        </div>
      )}

      {/* STATE 3: ERROR STATE */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3 max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-semibold text-red-900">{error}</h3>
          <button
            onClick={loadOrders}
            className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* STATE 4: EMPTY STATE */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-semibold text-slate-800 text-sm">Chưa Có Đơn Hàng Nào</h4>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc hiện tại.'
              : 'Các đơn hàng từ khách quét QR hoặc phục vụ sẽ xuất hiện tại đây.'}
          </p>
        </div>
      )}

      {/* STATE 1: NORMAL DATA DISPLAY */}

      {/* VIEW MODE 1: REDESIGNED CLEAN COMMERCIAL DATA TABLE */}
      {!loading && !error && filteredOrders.length > 0 && viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="max-h-[calc(100vh-320px)] min-h-[380px] overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider whitespace-nowrap sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-3.5 px-4 bg-slate-50">Mã Đơn & Vị Trí</th>
                  <th className="py-3.5 px-4 bg-slate-50">Thời Gian & Thanh Toán</th>
                  <th className="py-3.5 px-4 bg-slate-50">Danh Sách Món Đã Đặt</th>
                  <th className="py-3.5 px-4 bg-slate-50">Tổng Tiền</th>
                  <th className="py-3.5 px-4 text-right bg-slate-50">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  const paymentBadge = getPaymentMethodBadge(ord.paymentMethod, ord.paymentStatus);
                  const isTakeaway = ord.orderType === 'TAKEAWAY' || ord.tableNumber?.toLowerCase().includes('mang');
                  const cleanTableName = ord.tableNumber.toLowerCase().startsWith('bàn')
                    ? ord.tableNumber
                    : `Bàn ${ord.tableNumber}`;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order Code & Table */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-sm block">{ord.orderCode}</span>
                          {isTakeaway ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-200 inline-block mt-0.5">
                              Mang Về
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-semibold text-[11px] border border-orange-200 inline-block mt-0.5">
                              {cleanTableName} • {ord.zone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created At & Payment Method */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600 text-xs">
                        {(() => {
                          const dt = formatDetailedOrderTime(ord.createdAt);
                          return (
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-900 text-xs bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-orange-600" />
                                <span>{dt.time}</span>
                                {dt.date && <span className="text-[10px] text-slate-500 font-normal">({dt.date})</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] border ${paymentBadge.style}`}>
                                  {paymentBadge.label}
                                </span>
                                {ord.staffName && (
                                  <span className="text-[10px] text-slate-400">NV: {ord.staffName}</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Items Preview */}
                      <td className="py-4 px-4 min-w-[220px] max-w-xs">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800 line-clamp-1">
                            {ord.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">Tổng {ord.items.length} món ăn</p>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900 text-sm font-mono">
                        {formatVND(ord.totalAmount)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 whitespace-nowrap text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenDetailModal(ord)}
                          className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5 text-orange-600" />
                          <span>Chi tiết</span>
                        </button>

                        {ord.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, 'SERVED')}
                            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            <span>Đã Lên Món</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN GRID CARDS */}
      {!loading && !error && filteredOrders.length > 0 && viewMode === 'GRID' && (
        <div className="max-h-[calc(100vh-320px)] min-h-[380px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredOrders.map((ord) => {
            const badge = getStatusBadge(ord.status);
            const paymentBadge = getPaymentMethodBadge(ord.paymentMethod, ord.paymentStatus);
            const isTakeaway = ord.orderType === 'TAKEAWAY' || ord.tableNumber?.toLowerCase().includes('mang');
            const cleanTableName = ord.tableNumber.toLowerCase().startsWith('bàn')
              ? ord.tableNumber
              : `Bàn ${ord.tableNumber}`;

            return (
              <div
                key={ord.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-sm">{ord.orderCode}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${badge.style}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    {isTakeaway ? (
                      <span className="font-semibold text-purple-700">Mang Về (Takeaway)</span>
                    ) : (
                      <span className="font-semibold text-orange-600">{cleanTableName} ({ord.zone})</span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${paymentBadge.style}`}>
                      {paymentBadge.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {ord.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-800 line-clamp-1">
                          {it.name} <span className="text-orange-600 font-semibold">x{it.quantity}</span>
                        </span>
                        <span className="font-mono font-medium text-slate-900">{formatVND(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-slate-900">
                    <span className="text-xs text-slate-500 font-medium">Tổng tiền:</span>
                    <span className="text-sm font-bold font-mono text-orange-600">{formatVND(ord.totalAmount)}</span>
                  </div>

                  <button
                    onClick={() => handleOpenDetailModal(ord)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-orange-600" />
                    <span>Xem Chi Tiết & Vận Hành</span>
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* DETAILED ORDER MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-base">
              Chi Tiết Đơn Hàng {selectedOrder?.orderCode} - {selectedOrder?.orderType === 'TAKEAWAY' ? 'Mang Về' : `Bàn ${selectedOrder?.tableNumber}`}
            </span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={560}
        footer={null}
      >
        {selectedOrder && (
          <div className="space-y-4 pt-2 text-xs font-sans">
            {/* Header info */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedOrder.orderType === 'TAKEAWAY' ? 'Đơn Mang Về (Takeaway)' : `Bàn ${selectedOrder.tableNumber} • ${selectedOrder.zone}`}
                </h4>
                <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                  Mã đơn: <strong className="text-slate-800">{selectedOrder.orderCode}</strong> • {getPaymentMethodBadge(selectedOrder.paymentMethod, selectedOrder.paymentStatus).label}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusBadge(selectedOrder.status).style}`}>
                {getStatusBadge(selectedOrder.status).label}
              </span>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <p className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Danh sách các món đặt:</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{it.name}</p>
                      {it.note && <p className="text-[11px] text-amber-700 font-medium">Ghi chú: {it.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900 font-mono">
                        {formatVND(it.price)} <span className="text-orange-600 font-semibold">x{it.quantity}</span>
                      </p>
                      <p className="font-bold text-slate-900 font-mono">{formatVND(it.price * it.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount & Notes */}
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex justify-between items-center">
              <span className="font-semibold text-orange-950 text-sm">TỔNG TIỀN ĐƠN HÀNG:</span>
              <span className="font-bold text-lg font-mono text-orange-600">{formatVND(selectedOrder.totalAmount)}</span>
            </div>


            {/* Print Slip Action */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => message.info('Đang gửi lệnh in phiếu báo bếp (In Bill 80mm)...')}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-orange-600" />
                <span>In Phiếu Báo Bếp</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderListManagement;
