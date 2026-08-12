import React, { useState, useEffect, useMemo } from 'react';
import { KitchenOrder, OrderStatus, CategoryFilter, KdsHistoryLogItem } from '../../types/kds';
import {
  fetchKitchenOrders,
  fetchKitchenHistoryLog,
  updateOrderStatusApi,
  toggleItemCompletionApi,
  recallLastOrderApi,
  recallSpecificOrderApi,
  createSimulatedOrder,
  playNewOrderSound
} from '../../services/kdsApi';
import { KitchenTicketCard } from '../../components/kds/KitchenTicketCard';
import { KDSLoadingSkeleton } from '../../components/kds/KDSLoadingSkeleton';
import {
  ChefHat,
  Clock,
  Filter,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  Inbox,
  Volume2,
  History,
  CheckCircle2,
  Calendar,
  Utensils,
  Search,
  Check,
  Flame,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { message } from 'antd';
import { wsService } from '../../modules/client/services/websocket';

export const KitchenKiosk: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [historyLog, setHistoryLog] = useState<KdsHistoryLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KDS View Mode Tab: ACTIVE_KITCHEN vs HISTORY_TIMELINE
  const [activeTab, setActiveTab] = useState<'ACTIVE_KITCHEN' | 'HISTORY_TIMELINE'>('ACTIVE_KITCHEN');
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [recalledOrderNotice, setRecalledOrderNotice] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState(true);

  // Load KDS Orders & History Log
  const loadData = async () => {
    try {
      setError(null);
      const [ordersData, historyData] = await Promise.all([
        fetchKitchenOrders(),
        fetchKitchenHistoryLog(),
      ]);

      // Preserve local item completion (isCompleted) states across polling refetches by unique item ID
      setOrders((prevOrders) => {
        const localCompletedMap = new Set<string>();
        (prevOrders || []).forEach((o) => {
          (o.items || []).forEach((it) => {
            if (it.isCompleted) {
              localCompletedMap.add(`${o.id}-${it.id}`);
            }
          });
        });

        return ordersData.map((freshOrd) => ({
          ...freshOrd,
          items: (freshOrd.items || []).map((it) => ({
            ...it,
            isCompleted: localCompletedMap.has(`${freshOrd.id}-${it.id}`) || it.isCompleted,
          })),
        }));
      });

      setHistoryLog(historyData);
    } catch (err) {
      setError('Không thể kết nối đến máy chủ KDS. Vui lòng kiểm tra lại đường truyền.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. STOMP Real-Time Subscriber: Instant Order Notification when Customer Submits Order
    const unsubscribeNewOrders = wsService.subscribe('/topic/kitchen/orders', () => {
      playNewOrderSound();
      message.info({
        content: '🔔 Có đơn hàng mới gửi đến nhà bếp chế biến!',
        key: 'new-kitchen-order-alert',
      });
      loadData();
    });

    const unsubscribeHistory = wsService.subscribe('/topic/kitchen/completed-history', () => {
      loadData();
    });

    // 2. Dual-Layer Auto-Polling Fallback (3s Interval for 100% Reliability)
    const pollInterval = setInterval(() => {
      loadData();
    }, 3000);

    return () => {
      unsubscribeNewOrders();
      unsubscribeHistory();
      clearInterval(pollInterval);
    };
  }, []);

  // Update Status Action
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const updated = await updateOrderStatusApi(orderId, newStatus, targetOrder?.items);
    setOrders(updated);

    // Refresh history log
    const updatedHistory = await fetchKitchenHistoryLog();
    setHistoryLog(updatedHistory);

    if (newStatus === 'READY' || newStatus === 'COMPLETED') {
      message.success('Đã hoàn thành đơn hàng & chuyển sang Lịch sử KDS!');
      setRecalledOrderNotice('Đơn hàng vừa được bump xong. Bạn có thể xem lại trong Lịch Sử Dọc.');
      setTimeout(() => setRecalledOrderNotice(null), 10000);
    }
  };

  // Toggle Item Completion (Gạch món mượt mà 0ms latency)
  const handleToggleItem = (orderId: string, itemId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          items: ord.items.map((it) => {
            if (it.id !== itemId) return it;
            return { ...it, isCompleted: !it.isCompleted };
          }),
        };
      })
    );
  };

  // Recall / Undo Last Ticket
  const handleRecallOrder = async () => {
    const { orders: updated, recalledTicket } = await recallLastOrderApi();
    setOrders(updated);
    const updatedHistory = await fetchKitchenHistoryLog();
    setHistoryLog(updatedHistory);
    setRecalledOrderNotice(null);
    if (recalledTicket) {
      playNewOrderSound();
      message.info(`Đã khôi phục đơn ${recalledTicket.orderCode} (${recalledTicket.tableName}) quay về Bếp!`);
    }
  };

  // Recall specific item from history timeline
  const handleRecallSpecificHistory = async (historyId: string) => {
    const updated = await recallSpecificOrderApi(historyId);
    setOrders(updated);
    const updatedHistory = await fetchKitchenHistoryLog();
    setHistoryLog(updatedHistory);
    playNewOrderSound();
    message.success('Đã khôi phục đơn hàng từ lịch sử quay lại màn hình Bếp!');
  };

  // Trigger Simulated Order
  const handleSimulateNewOrder = () => {
    const newOrder = createSimulatedOrder();
    setOrders((prev) => [...prev, newOrder]);
    message.success('Đã thêm 1 đơn hàng mới thử nghiệm vào KDS!');
  };

  // Aggregated Dish Quantities Matrix across ALL active orders
  const aggregatedDishes = useMemo(() => {
    const map = new Map<string, { name: string; totalQty: number; category: string }>();
    (orders || []).forEach((ord) => {
      (ord?.items || []).forEach((it) => {
        if (!it.isCompleted) {
          const existing = map.get(it.name);
          if (existing) {
            existing.totalQty += it.quantity;
          } else {
            map.set(it.name, { name: it.name, totalQty: it.quantity, category: it.category || 'all' });
          }
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [orders]);

  // Filter Active Orders
  const filteredOrders = (orders || [])
    .filter((order) => {
      if (filterCategory === 'all') return true;
      return (order?.items || []).some((item) => item.category === filterCategory);
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Filtered History Log
  const filteredHistoryLog = (historyLog || []).filter((h) => {
    const query = historySearchQuery.toLowerCase();
    return (
      (h?.orderCode || '').toLowerCase().includes(query) ||
      (h?.tableName || '').toLowerCase().includes(query) ||
      (h?.items || []).some((i) => (i?.name || '').toLowerCase().includes(query))
    );
  });

  // Calculate Avg Prep Time
  const avgPrepTime =
    historyLog.length > 0
      ? Math.round(historyLog.reduce((s, h) => s + h.prepDurationMinutes, 0) / historyLog.length)
      : 0;

  return (
    <div className="space-y-4 font-sans max-w-7xl mx-auto">
      
      {/* 1. TOP NAVIGATION VIEW SWITCHER TABS (ĐÃ GỠ BỎ TOÀN BỘ PHỤ ĐỀ TRONG DẤU WACKET '()') */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Main View Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ACTIVE_KITCHEN')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ACTIVE_KITCHEN'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Đơn Đang Chế Biến</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
              activeTab === 'ACTIVE_KITCHEN' ? 'bg-orange-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY_TIMELINE')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'HISTORY_TIMELINE'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>Lịch Sử Hoàn Thành</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
              activeTab === 'HISTORY_TIMELINE' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {historyLog.length}
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateNewOrder}
            className="h-9 px-3.5 rounded-xl border border-orange-200/80 bg-orange-50 hover:bg-orange-100 text-orange-950 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Thêm thử đơn mới có tiếng Chuông Báo"
          >
            <Volume2 className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">Thử đơn mới</span>
          </button>

          <button
            onClick={loadData}
            className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Làm mới KDS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* 4 UI STATES HANDLING */}

      {/* STATE 2: LOADING SKELETON */}
      {loading && <KDSLoadingSkeleton />}

      {/* STATE 3: ERROR STATE */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3 max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">{error}</h3>
          <button
            onClick={loadData}
            className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* VIEW 1: ACTIVE KITCHEN TICKETS GRID */}
      {!loading && !error && activeTab === 'ACTIVE_KITCHEN' && (
        <div className="space-y-4">
          
          {/* FEATURE 1: BẢNG TỔNG GOM MÓN CHẾ BIẾN - GỠ BỎ PHỤ ĐỀ DẤU DÒNG '()' */}
          {aggregatedDishes.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-orange-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-800 tracking-tight">
                    Tổng gom món cần chế biến
                  </h3>
                  <span className="text-[11px] font-semibold bg-orange-50 text-orange-800 px-2.5 py-0.5 rounded-full border border-orange-200/80">
                    Gom tổng {aggregatedDishes.reduce((s, i) => s + i.totalQty, 0)} phần
                  </span>
                </div>

                <button
                  onClick={() => setShowMatrix(!showMatrix)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  {showMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showMatrix && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                  {aggregatedDishes.map((dish) => (
                    <div
                      key={dish.name}
                      className="p-2.5 rounded-xl bg-orange-50/50 border border-orange-100 flex items-center justify-between text-xs hover:bg-orange-50 transition-colors"
                    >
                      <span className="font-medium text-slate-700 line-clamp-1 pr-1">{dish.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-orange-600 text-white font-bold text-xs flex-shrink-0">
                        x{dish.totalQty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORY FILTERS BAR */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
              <span className="text-slate-500 font-medium px-2 flex items-center gap-1 hidden sm:inline-flex">
                <Filter className="w-3.5 h-3.5 text-orange-600" /> Lọc món:
              </span>
              {[
                { id: 'all', label: 'Tất cả món' },
                { id: 'grill', label: 'Món nướng' },
                { id: 'soup', label: 'Món nước' },
                { id: 'drink', label: 'Đồ uống' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id as CategoryFilter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filterCategory === f.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {recalledOrderNotice && (
              <button
                onClick={handleRecallOrder}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục đơn vừa xong</span>
              </button>
            )}
          </div>

          {/* ACTIVE TICKETS GRID */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Không Có Đơn Hàng Nào Đang Chờ Chế Biến</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hiện tại các đơn hàng gọi từ khách tại bàn đã được hoàn thành hết. Bấm vào tab "Lịch Sử Hoàn Thành" để xem lại các đơn đã trả.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order, orderIdx) => (
                <KitchenTicketCard
                  key={`kds-order-${order.id}-${orderIdx}`}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleItem={handleToggleItem}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DEDICATED VERTICAL TIMELINE KDS HISTORY LOG PAGE */}
      {!loading && !error && activeTab === 'HISTORY_TIMELINE' && (
        <div className="space-y-5">
          
          {/* HISTORY METRICS SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Đơn Đã Hoàn Thành</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{historyLog.length} Đơn</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời Gian Chế Biến TB</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{avgPrepTime} phút/đơn</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div className="w-full">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tìm Kiếm Nhật Ký</p>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm mã đơn, tên bàn, tên món..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* VERTICAL TIMELINE STREAM CONTAINER */}
          {filteredHistoryLog.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
              <History className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Chưa Có Lịch Sử Hoàn Thành Nào</h4>
              <p className="text-xs text-slate-500">
                Các đơn hàng sau khi chế biến xong và ấn Bump sẽ xuất hiện tại timeline lịch sử này.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200/80 ml-4 md:ml-6 pl-6 space-y-6">
              {filteredHistoryLog.map((log, logIdx) => (
                <div key={`hist-log-${log.id}-${logIdx}`} className="relative group">
                  
                  {/* TIMELINE NODE DOT MARKER */}
                  <div className="absolute -left-[41px] top-1.5 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center border-4 border-slate-50 shadow-2xs font-bold flex-shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>

                  {/* TIMELINE CARD CONTENT */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 hover:shadow-md transition-all">
                    
                    {/* Timeline Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">{log.orderCode}</span>
                        <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 font-bold text-xs border border-orange-200/80">
                          {log.tableName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-xs inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 🟢 Đã Hoàn Thành
                        </span>

                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs">
                          ⏱️ Chế biến trong <strong>{log.prepDurationMinutes} phút</strong>
                        </span>
                      </div>
                    </div>

                    {/* Timeline Items Completed Table */}
                    <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                      <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                        Danh sách các món ăn đã chế biến xong:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {(log.items || []).map((it, itIdx) => (
                          <div key={`hist-item-${log.id}-${it.id}-${itIdx}`} className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-slate-900">{it.name}</p>
                              {it.note && <p className="text-[10px] text-amber-800 font-medium mt-0.5">Ghi chú: {it.note}</p>}
                            </div>
                            <span className="font-bold text-orange-600 ml-2">x{it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Bottom Footer: Exact Timestamp & Recall Button */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-mono text-slate-500 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Mốc thời gian hoàn thành: <strong>{log.completedAt}</strong>
                      </span>

                      <button
                        onClick={() => handleRecallSpecificHistory(log.id)}
                        className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Khôi phục đơn này quay về Bếp"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                        <span>Khôi Phục Đơn Về Bếp</span>
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
