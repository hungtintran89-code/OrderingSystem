import React, { useState, useEffect, useMemo } from 'react';
import { KitchenOrder, OrderStatus, CategoryFilter, KdsHistoryLogItem } from '../../types/kds';
import {
  fetchKitchenOrders,
  fetchKitchenHistoryLog,
  fetchCategoriesApi,
  KdsCategoryItem,
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
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { message } from 'antd';
import { wsService } from '../../modules/client/services/websocket';

export const KitchenKiosk: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [historyLog, setHistoryLog] = useState<KdsHistoryLogItem[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<KdsCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KDS View Mode Tab: ACTIVE_KITCHEN vs HISTORY_TIMELINE
  const [activeTab, setActiveTab] = useState<'ACTIVE_KITCHEN' | 'HISTORY_TIMELINE'>('ACTIVE_KITCHEN');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<'TODAY' | 'ALL' | 'CUSTOM'>('TODAY');
  const [customDate, setCustomDate] = useState<string>('');
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [recalledOrderNotice, setRecalledOrderNotice] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState(true);

  // State to track locally checked item keys: "${orderId}-${itemId}"
  const [checkedItemKeys, setCheckedItemKeys] = useState<Set<string>>(new Set());

  const toggleExpandHistory = (id: string) => {
    setExpandedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Load KDS Orders, History Log & Catalog Categories
  const loadData = async () => {
    try {
      setError(null);
      const [ordersData, historyData, catData] = await Promise.all([
        fetchKitchenOrders(),
        fetchKitchenHistoryLog(),
        fetchCategoriesApi(),
      ]);

      // Map fresh orders while checking checkedItemKeys or backend item completion
      setOrders(
        (ordersData || []).map((freshOrd) => ({
          ...freshOrd,
          items: (freshOrd.items || []).map((it) => ({
            ...it,
            isCompleted: checkedItemKeys.has(`${freshOrd.id}-${it.id}`) || Boolean(it.isCompleted),
          })),
        }))
      );

      setHistoryLog(historyData);
      if (catData && catData.length > 0) {
        setDynamicCategories(catData);
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ KDS. Vui lòng kiểm tra lại đường truyền.');
    } finally {
      setLoading(false);
    }
  };

  // State to track current time in MS for live ticking relative completedAt string (e.g. 1 min ago -> 2 mins ago -> 60 mins ago -> 1 hour ago)
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const getLiveRelativeCompletedAt = (log: KdsHistoryLogItem, currentNow: number) => {
    if (!log.completedTimestampMs) return log.completedAt;
    const diffMins = Math.floor((currentNow - log.completedTimestampMs) / 60000);
    if (diffMins < 1) return 'Hoàn thành vừa xong';
    if (diffMins < 60) return `Hoàn thành ${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hoàn thành ${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hoàn thành ${diffDays} ngày trước`;
  };

  useEffect(() => {
    loadData();

    // 1. STOMP Real-Time Subscriber: Instant Order Notification when Customer Submits Order
    const unsubscribeNewOrders = wsService.subscribe('/topic/kitchen/orders', () => {
      // Sound alert removed per user directive
      message.info({
        content: '🔔 Có đơn hàng mới gửi đến nhà bếp chế biến!',
        key: 'new-kitchen-order-alert',
      });
      loadData();
    });

    const unsubscribeHistory = wsService.subscribe('/topic/kitchen/completed-history', () => {
      loadData();
    });

    // 2. Realtime Menu / Category Updates Subscriber (Dynamic Catalog Sync)
    const unsubscribeMenuUpdates = wsService.subscribe('/topic/menu/updates', () => {
      fetchCategoriesApi().then((cats) => {
        if (cats && cats.length > 0) setDynamicCategories(cats);
      });
    });

    // 3. Dual-Layer Auto-Polling Fallback (3s Interval for 100% Reliability)
    const pollInterval = setInterval(() => {
      loadData();
    }, 3000);

    // 4. Continuous Relative Time Ticking Timer (Ticks live relative time every 5 seconds)
    const liveTickInterval = setInterval(() => {
      setNowMs(Date.now());
    }, 5000);

    return () => {
      unsubscribeNewOrders();
      unsubscribeHistory();
      unsubscribeMenuUpdates();
      clearInterval(pollInterval);
      clearInterval(liveTickInterval);
    };
  }, [checkedItemKeys]);

  // Update Status Action
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);

    // Clear checked keys for this orderId when completing/bumping
    if (newStatus === 'READY' || newStatus === 'COMPLETED') {
      setCheckedItemKeys((prev) => {
        const next = new Set(prev);
        if (targetOrder?.items) {
          targetOrder.items.forEach((it) => {
            next.delete(`${orderId}-${it.id}`);
          });
        }
        Array.from(next).forEach((key) => {
          if (key.startsWith(`${orderId}-`)) {
            next.delete(key);
          }
        });
        return next;
      });
    }

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
    const itemKey = `${orderId}-${itemId}`;
    setCheckedItemKeys((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });

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
    const updated = await recallLastOrderApi();
    setOrders(updated);
    const updatedHistory = await fetchKitchenHistoryLog();
    setHistoryLog(updatedHistory);
    setRecalledOrderNotice(null);
    playNewOrderSound();
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
  const handleSimulateNewOrder = async () => {
    const updated = await createSimulatedOrder();
    setOrders(updated);
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
      return (order?.items || []).some((item) => {
        const itemCat = (item.category || '').toLowerCase();
        const targetCat = String(filterCategory).toLowerCase();
        return itemCat === targetCat || itemCat.includes(targetCat) || targetCat.includes(itemCat);
      });
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Filtered History Log by Date & Search Query
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const dateFilteredHistoryLog = useMemo(() => {
    return (historyLog || []).filter((h) => {
      if (selectedHistoryDate === 'TODAY') {
        return !h.completedDateStr || h.completedDateStr === todayDateStr;
      }
      if (selectedHistoryDate === 'CUSTOM' && customDate) {
        return h.completedDateStr === customDate;
      }
      return true; // 'ALL'
    });
  }, [historyLog, selectedHistoryDate, customDate, todayDateStr]);

  const filteredHistoryLog = useMemo(() => {
    return dateFilteredHistoryLog.filter((h) => {
      const query = historySearchQuery.toLowerCase();
      return (
        (h?.orderCode || '').toLowerCase().includes(query) ||
        (h?.tableName || '').toLowerCase().includes(query) ||
        (h?.items || []).some((i) => (i?.name || '').toLowerCase().includes(query))
      );
    });
  }, [dateFilteredHistoryLog, historySearchQuery]);

  // Calculate Avg Prep Time for date-filtered history
  const avgPrepTime = useMemo(() => {
    if (dateFilteredHistoryLog.length === 0) return 0;
    const totalMinutes = dateFilteredHistoryLog.reduce((s, h) => s + (h.prepDurationMinutes || 0), 0);
    return Math.round(totalMinutes / dateFilteredHistoryLog.length);
  }, [dateFilteredHistoryLog]);

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-2.5 font-sans w-full h-full overflow-hidden">
      
      {/* 1. TOP NAVIGATION VIEW SWITCHER TABS - CỐ ĐỊNH PHÍA TRÊN */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
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
              {dateFilteredHistoryLog.length}
            </span>
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
      {!loading && !error && (
        <div className={activeTab === 'ACTIVE_KITCHEN' ? 'flex-1 min-h-0 flex flex-col space-y-3 overflow-hidden h-full' : 'hidden'}>
          
          {/* FEATURE 1: BẢNG TỔNG GOM MÓN CHẾ BIẾN - CỐ ĐỊNH PHÍA TRÊN */}
          {aggregatedDishes.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-orange-200/80 shadow-2xs space-y-2.5 flex-shrink-0">
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

          {/* CATEGORY FILTERS BAR - CỐ ĐỊNH PHÍA TRÊN */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
              <span className="text-slate-500 font-medium px-2 flex items-center gap-1 hidden sm:inline-flex">
                <Filter className="w-3.5 h-3.5 text-orange-600" /> Lọc món:
              </span>
              
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                Tất cả món
              </button>

              {dynamicCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.name)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filterCategory === cat.name
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {cat.name}
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

          {/* ACTIVE TICKETS GRID CONTAINER CARD - KHUNG DIV CỐ ĐỊNH CÓ THANH CUỘN NỘI BỘ VÀ KHÔNG TRÀN MÀN HÌNH */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-3.5 flex-1 min-h-0 overflow-y-scroll custom-scrollbar pr-1.5 mb-1">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center space-y-3 my-4">
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
        </div>
      )}
      {!loading && !error && (
        <div className={activeTab === 'HISTORY_TIMELINE' ? 'flex-1 min-h-0 flex flex-col space-y-3 overflow-hidden h-full' : 'hidden'}>
          
          {/* HISTORY METRICS & DATE FILTER BAR - CỐ ĐỊNH PHÍA TRÊN */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 flex-shrink-0">
            {/* Date Filter Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-1">
                  <Calendar className="w-4 h-4 text-orange-600" /> Xem lịch sử theo ngày:
                </span>
                <button
                  onClick={() => setSelectedHistoryDate('TODAY')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedHistoryDate === 'TODAY'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => setSelectedHistoryDate('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedHistoryDate === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  Tất cả ngày
                </button>
              </div>

              {/* Custom Date Picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Chọn ngày cụ thể:</span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    if (e.target.value) setSelectedHistoryDate('CUSTOM');
                  }}
                  className="px-3 py-1 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tổng Đơn Đã Hoàn Thành</p>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{dateFilteredHistoryLog.length} Đơn</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Thời Gian Chế Biến TB</p>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{avgPrepTime} phút/đơn</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  <Clock className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="w-full">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tìm Kiếm Nhật Ký</p>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Tìm mã đơn, tên bàn..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 rounded-lg border border-slate-200 text-xs bg-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VERTICAL LIST CONTAINER CARD - THIẾT KẾ DẠNG LIST FULL WIDTH CHUẨN XÁC VỚI BÊN ĐƠN CHẾ BIẾN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-3.5 flex-1 min-h-0 overflow-y-scroll custom-scrollbar pr-1.5 mb-1 w-full space-y-2.5">
            {filteredHistoryLog.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
                <History className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">Chưa Có Lịch Sử Hoàn Thành Nào</h4>
                <p className="text-xs text-slate-500">
                  Không tìm thấy đơn hàng hoàn thành nào trong khoảng thời gian đã chọn.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 w-full">
                {filteredHistoryLog.map((log, logIdx) => {
                  return (
                    <div
                      key={`hist-log-${log.id}-${logIdx}`}
                      className="bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 transition-all w-full flex flex-col space-y-2"
                    >
                      {/* LIST ITEM HEADER ROW: LEFT BADGES & RIGHT EXACT TIMESTAMP (HH:mm:ss) */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">{log.orderCode}</span>
                          <span className="px-2.5 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold text-xs border border-orange-200/80">
                            {log.tableName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-[11px] inline-flex items-center gap-1">
                            Đã Hoàn Thành
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-600 font-bold text-xs flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
                            <Clock className="w-3.5 h-3.5 text-orange-600" />
                            <span>Mốc hoàn thành: </span>
                            <strong className="text-orange-700">
                              {(() => {
                                if (log.completedTimestampMs) {
                                  const date = new Date(log.completedTimestampMs);
                                  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                                }
                                if (log.completedAt) {
                                  const date = new Date(log.completedAt);
                                  if (!isNaN(date.getTime())) {
                                    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                                  }
                                  if (/^\d{2}:\d{2}(:\d{2})?$/.test(log.completedAt)) {
                                    return log.completedAt.length === 5 ? `${log.completedAt}:00` : log.completedAt;
                                  }
                                }
                                return '--:--:--';
                              })()}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* LIST ITEM CONTENT: ALWAYS SHOW ALL DISHES OF THE ORDER BY DEFAULT */}
                      <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/60 space-y-1.5">
                        <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                          Danh sách món ăn trong đơn ({(log.items || []).length}):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {(log.items || []).map((it, itIdx) => (
                            <div key={`hist-item-${log.id}-${it.id}-${itIdx}`} className="p-2 rounded-md bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                              <span className="font-medium text-slate-800 whitespace-normal break-words">{it.name}</span>
                              <span className="font-bold text-orange-600 ml-2 flex-shrink-0">x{it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
