import React, { useState, useEffect } from 'react';
import { AdminTable, TableStatus } from '../../types/admin';
import {
  fetchAdminTablesApi,
  updateTableStatusApi,
  createVietQrPaymentApi,
  checkoutTableApi,
  fetchMasterTableOrderApi,
  checkPayOSPaymentStatusApi,
  confirmPaymentSuccessApi
} from '../../api/adminApi';
import { wsService } from '../../modules/client/services/websocket';
import {
  LayoutGrid,
  Clock,
  Bell,
  CreditCard,
  Printer,
  ArrowRightLeft,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Receipt,
  FileText,
  DollarSign,
  QrCode,
  Check,
  Building2,
  Ban
} from 'lucide-react';
import { Drawer, Modal, Tabs, message, notification, Image as AntImage } from 'antd';
import { PaymentCheckoutModal } from '../payment/PaymentCheckoutModal';

interface OrderedItem {
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

// Format Table Name helper to fix "Bàn Bàn 01" -> "Bàn 01"
const formatTableName = (tableName?: string): string => {
  if (!tableName) return 'Bàn 01';
  const clean = tableName.replace(/^bàn\s+/i, '').trim();
  return clean ? `Bàn ${clean}` : tableName;
};

// Format Currency VND Helper
const formatVND = (num?: number): string => {
  if (num === undefined || num === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
};



export const StaffTableMap: React.FC = () => {
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Order from DB for Selected Table
  const [activeTableOrder, setActiveTableOrder] = useState<any>(null);
  const [fetchingOrder, setFetchingOrder] = useState(false);

  // Modal Detail State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailTable, setSelectedDetailTable] = useState<AdminTable | null>(null);

  // Modal Checkout Payment State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedCheckoutTable, setSelectedCheckoutTable] = useState<AdminTable | null>(null);
  const [paymentMethodTab, setPaymentMethodTab] = useState<'CASH' | 'QR'>('CASH');

  // Cash payment calculation state
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  // VietQR state from API /api/v1/payments/create-vietqr
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState<string>('');
  const [qrPaymentStatus, setQrPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [accountInfo, setAccountInfo] = useState<any>(undefined);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [activePayosOrderCode, setActivePayosOrderCode] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // Tự động reset dữ liệu QR khi đóng Modal thanh toán để đảm bảo mở lại sẽ ở trạng thái sạch 100%
  useEffect(() => {
    if (!isCheckoutModalOpen) {
      setCheckoutUrl('');
      setQrCodeImageUrl('');
      setQrPaymentStatus('IDLE');
      setAccountInfo(undefined);
      setActivePayosOrderCode(null);
      setActiveSessionId(null);
    }
  }, [isCheckoutModalOpen]);

  // Đếm ngược 3 giây khi thanh toán thành công ➔ Tự động đóng modal & clear bàn
  useEffect(() => {
    let timer: any = null;
    if (qrPaymentStatus === 'SUCCESS' && isCheckoutModalOpen) {
      setCountdownSeconds(3);
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (selectedCheckoutTable) {
              handleConfirmCompletePayment(selectedCheckoutTable.id, 'VIETQR');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [qrPaymentStatus, isCheckoutModalOpen]);

  const loadTables = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await fetchAdminTablesApi();
      setTables(data);
    } catch (err) {
      setError('Không thể tải sơ đồ bàn phục vụ. Vui lòng thử lại.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();

    // 1. Lắng nghe kênh WebSocket Realtime khi khách đặt món hoặc thanh toán để đổi màu bàn tức thì không cần F5
    const unsubFloorMap = wsService.subscribe('/topic/tables/floor-map', (data) => {
      if (data) {
        setTables((prevTables) => {
          if (!prevTables || prevTables.length === 0) return prevTables;

          const updates = Array.isArray(data) ? data : [data];
          let updatedAny = false;

          const newTables = prevTables.map((tbl) => {
            const match = updates.find(
              (u) =>
                (u.tableId && String(u.tableId) === tbl.id) ||
                (u.tableName && formatTableName(u.tableName) === formatTableName(tbl.tableNumber)) ||
                (u.tableName && u.tableName === tbl.tableNumber)
            );

            if (match) {
              updatedAny = true;
              return {
                ...tbl,
                status: match.status || tbl.status,
                totalAmount:
                  match.tempTotalAmount !== undefined && match.tempTotalAmount !== null
                    ? Number(match.tempTotalAmount)
                    : tbl.totalAmount,
                zone: match.zone || tbl.zone,
                capacity: match.capacity ? Number(match.capacity) : tbl.capacity,
              };
            }
            return tbl;
          });

          return updatedAny ? newTables : prevTables;
        });

        setTimeout(() => {
          loadTables(false);
        }, 300);
      }
    });

    // 2. Lắng nghe kênh WebSocket Alerts khi nhận Webhook thanh toán thành công
    const unsubAlerts = wsService.subscribe('/topic/admin/tables/alerts', (data) => {
      if (data && (data.type === 'PAYMENT_SUCCESS' || data.status === 'SUCCESS')) {
        notification.success({
          message: 'Thanh Toán Thành Công! 🎉',
          description: data.message || `Đã nhận khoản thanh toán từ ${data.tableName || 'bàn'}`,
          duration: 4,
          placement: 'topRight',
        });

        // Đặt trạng thái thành SUCCESS để kích hoạt khung thành công & tự đóng Modal sau 1.5s
        setQrPaymentStatus('SUCCESS');

        // Tải lại dữ liệu bàn
        loadTables(false);
      }
    });

    // 3. Lắng nghe kênh WebSocket Service Requests khi khách vừa gọi trợ giúp / gọi tính tiền ➔ Đổi màu bàn LẬP TỨC 1ms
    const unsubServiceReqs = wsService.subscribe('/topic/admin/service-requests', (data) => {
      if (data) {
        setTables((prevTables) => {
          if (!prevTables || prevTables.length === 0) return prevTables;

          return prevTables.map((tbl) => {
            const isMatch =
              (data.tableId && String(data.tableId) === tbl.id) ||
              (data.tableName && formatTableName(data.tableName) === formatTableName(tbl.tableNumber)) ||
              (data.tableName && data.tableName === tbl.tableNumber);

            if (isMatch) {
              if (data.requestStatus === 'PENDING') {
                const reqType = data.requestType || '';
                const newStatus: TableStatus = (reqType.includes('BILL') || reqType.includes('PAYMENT'))
                  ? 'BILL_REQUESTED'
                  : 'CALLING_STAFF';
                
                // Quy tắc ưu tiên: Nếu bàn đang ở BILL_REQUESTED (màu Đỏ), không hạ cấp xuống CALLING_STAFF (màu Vàng)
                if (tbl.status === 'BILL_REQUESTED' && newStatus === 'CALLING_STAFF') {
                  return tbl;
                }
                return { ...tbl, status: newStatus };
              } else if (data.requestStatus === 'COMPLETED') {
                loadTables(false);
              }
            }
            return tbl;
          });
        });
      }
    });

    return () => {
      if (unsubFloorMap) unsubFloorMap();
      if (unsubAlerts) unsubAlerts();
      if (unsubServiceReqs) unsubServiceReqs();
    };
  }, []);

  // 3. Dual-Layer Fast Polling (1.5s Interval Backup) kiểm tra trạng thái thanh toán PayOS
  useEffect(() => {
    let timer: any = null;
    const targetSessionId = activeSessionId || activeTableOrder?.tableSessionId || selectedCheckoutTable?.session?.tableSessionId;

    if (isCheckoutModalOpen && qrPaymentStatus === 'PENDING') {
      timer = setInterval(async () => {
        const res = await checkPayOSPaymentStatusApi(
          activePayosOrderCode || undefined,
          targetSessionId ? Number(targetSessionId) : undefined
        );
        if (res && (res.status === 'SUCCESS' || res.status === 'PAID')) {
          clearInterval(timer);
          setQrPaymentStatus('SUCCESS');
          const tableName = selectedCheckoutTable?.tableNumber || res.tableName || 'bàn';
          notification.success({
            message: 'Thanh Toán VietQR Thành Công! 🎉',
            description: `${formatTableName(tableName)} đã nhận đủ tiền chuyển khoản từ khách hàng.`,
            duration: 4,
            placement: 'topRight',
          });
          loadTables(false);
        }
      }, 1500);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCheckoutModalOpen, qrPaymentStatus, activePayosOrderCode, activeSessionId, selectedCheckoutTable, activeTableOrder]);

  const loadActiveTableOrder = async (tableId: string) => {
    setFetchingOrder(true);
    try {
      const orderData = await fetchMasterTableOrderApi(tableId);
      setActiveTableOrder(orderData);
    } catch (err) {
      console.error('Error loading order for table:', err);
      setActiveTableOrder(null);
    } finally {
      setFetchingOrder(false);
    }
  };

  const handleManualSyncConfirm = async () => {
    const tableSessionId = activeTableOrder?.tableSessionId || selectedCheckoutTable?.tableSessionId;
    if (tableSessionId) {
      await confirmPaymentSuccessApi(Number(tableSessionId));
    }
  };

  // --- OPEN DETAIL MODAL ---
  const handleOpenDetailModal = (table: AdminTable) => {
    setSelectedDetailTable(table);
    setIsDetailModalOpen(true);
    loadActiveTableOrder(table.id);
  };

  // --- OPEN CHECKOUT MODAL ---
  const handleOpenCheckoutModal = (table: AdminTable) => {
    setSelectedCheckoutTable(table);
    setCashReceived('');
    setCheckoutUrl('');
    setQrCodeImageUrl('');
    setQrPaymentStatus('PENDING');
    setPaymentMethodTab('CASH');
    setIsCheckoutModalOpen(true);
    loadActiveTableOrder(table.id);
  };

  // Switch from Detail Modal to Checkout Modal
  const handleSwitchToCheckout = () => {
    if (selectedDetailTable) {
      const target = selectedDetailTable;
      setIsDetailModalOpen(false);
      handleOpenCheckoutModal(target);
    }
  };

  // Complete Payment Action & Clear Table in DB
  const handleConfirmCompletePayment = async (tableId: string, paymentMethod: 'CASH' | 'VIETQR' = 'CASH') => {
    try {
      const recvAmount = typeof cashReceived === 'number' ? cashReceived : undefined;
      await checkoutTableApi(tableId, paymentMethod, recvAmount);

      const tableName = selectedCheckoutTable?.tableNumber || tableId;
      notification.success({
        message: 'Thanh Toán Thành Công! 🎉',
        description: `${formatTableName(tableName)} đã được hoàn tất thanh toán và tự động đóng phiên làm việc thành công.`,
        duration: 4.5,
        placement: 'topRight',
      });

      // Tắt Modal và reset trạng thái lập tức
      setIsCheckoutModalOpen(false);
      setSelectedCheckoutTable(null);
      setCheckoutUrl('');
      setQrCodeImageUrl('');
      setCashReceived('');
      setQrPaymentStatus('PENDING');

      await loadTables();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi thanh toán đơn hàng';
      message.error(msg);
    }
  };

  // CALL API /api/v1/payments/create-vietqr AND EXTRACT checkoutUrl ONLY WHEN CLICKED
  const handleGenerateVietQR = async () => {
    if (!selectedCheckoutTable) return;
    try {
      setIsGeneratingQr(true);
      const totalAmt = getTableTotalAmount(selectedCheckoutTable);
      
      const response = await createVietQrPaymentApi(
        selectedCheckoutTable.tableNumber,
        totalAmt,
        selectedCheckoutTable.id,
        selectedCheckoutTable.session?.tableSessionId
      );
      
      setCheckoutUrl(response.checkoutUrl);
      setQrCodeImageUrl(response.qrDataUrl);
      setQrPaymentStatus('PENDING');
      if (response.payosOrderCode) setActivePayosOrderCode(response.payosOrderCode);
      if (response.tableSessionId) setActiveSessionId(response.tableSessionId);
      if (response.accountName || response.accountNumber) {
        setAccountInfo({
          bankName: response.bankName || 'Ngân hàng TMCP Quân đội (MBBank)',
          accountName: response.accountName || 'PAYOS MERCHANT',
          accountNumber: response.accountNumber || '',
        });
      }
      message.success('Đã tạo mã QR thanh toán PayOS VietQR!');
    } catch (err: any) {
      // Reset QR state khi lỗi - KHÔNG fallback QR giả (Toast lỗi đã được apiClient interceptor hiển thị tập trung)
      setCheckoutUrl('');
      setQrCodeImageUrl('');
      setQrPaymentStatus('IDLE');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // HỦY GIAO DỊCH QR (CANCEL QR TRANSACTION)
  const handleCancelQrPayment = () => {
    setCheckoutUrl('');
    setQrCodeImageUrl('');
    setQrPaymentStatus('PENDING');
    message.info('Đã hủy giao dịch thanh toán mã QR');
  };

  // SIMULATE PAYMENT RESULT (Thành công / Thất bại)
  const handleSimulateQrResult = (status: 'SUCCESS' | 'FAILED') => {
    setQrPaymentStatus(status);
    if (status === 'SUCCESS') {
      message.success('Thanh toán mã QR thành công!');
      setTimeout(() => {
        if (selectedCheckoutTable) {
          handleConfirmCompletePayment(selectedCheckoutTable.id, 'VIETQR');
        }
      }, 1200);
    } else {
      message.error('Thanh toán mã QR thất bại!');
    }
  };

  // Get orders list for a table with GROUPING logic for same items (x2, x3...)
  const getOrdersForTable = (tableNumber?: string): OrderedItem[] => {
    const itemList = activeTableOrder?.allTableItems || activeTableOrder?.items;
    if (!Array.isArray(itemList) || itemList.length === 0) {
      return [];
    }

    const rawItems: OrderedItem[] = itemList.map((item: any) => ({
      name: item.productName || item.name || 'Món ăn',
      quantity: Number(item.quantity || 1),
      price: Number(item.priceProduct || item.price || item.unitPrice || 0),
      note: item.note || item.notes || ''
    }));

    // GOM NHÓM NẾU CÙNG TÊN MÓN VÀ CÙNG GHI CHÚ -> x2, x3...
    const groupedMap = new Map<string, OrderedItem>();
    for (const item of rawItems) {
      const key = `${(item.name || '').trim()}__${(item.note || '').trim()}`;
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.quantity += item.quantity;
      } else {
        groupedMap.set(key, { ...item });
      }
    }
    return Array.from(groupedMap.values());
  };

  // Helper lấy đúng 100% số tiền của bàn từ Database / API Backend
  const getTableTotalAmount = (table?: AdminTable | null): number => {
    if (!table) return 0;
    const orders = getOrdersForTable(table.tableNumber);
    if (orders && orders.length > 0) {
      return orders.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
    if (activeTableOrder?.totalPrice !== undefined && activeTableOrder?.totalPrice !== null && activeTableOrder.totalPrice > 0) {
      return Number(activeTableOrder.totalPrice);
    }
    if (table.totalAmount !== undefined && table.totalAmount !== null && table.totalAmount > 0) {
      return Number(table.totalAmount);
    }
    return 0;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 font-sans h-full overflow-hidden w-full">
      {/* MAP STATUS LEGEND TOOLBAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <LayoutGrid className="w-6 h-6 text-orange-600 stroke-[2.2] flex-shrink-0" />
          <h2 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">Sơ Đồ Phục Vụ & Trạng Thái Bàn</h2>
        </div>

        {/* 4 Status Legend Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 🟢 Trống
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span> 🟠 Đang ăn
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> 🟡 Gọi phục vụ
          </span>
          <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-300 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> 🔴 Yêu cầu tính tiền
          </span>
        </div>
      </div>

      {/* 4 UI STATES HANDLING */}

      {/* STATE 2: LOADING SKELETON */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-5 rounded-xl border border-slate-200 h-44 space-y-3 shadow-2xs">
              <div className="h-6 bg-slate-200 rounded w-20"></div>
              <div className="h-4 bg-slate-200 rounded w-28"></div>
              <div className="h-8 bg-slate-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* STATE 3: ERROR STATE */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3 max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">{error}</h3>
          <button
            onClick={() => loadTables()}
            className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* STATE 1: SCROLLABLE TABLE GRID CONTAINER CARD ("Ô VUÔNG CUỘN THEO DẦN") */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1.5 mb-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {tables.map((table) => {
              let cardStyle = 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-400';
              let statusText = 'Trống';

              if (table.status === 'OCCUPIED') {
                cardStyle = 'bg-slate-100 text-slate-900 border-slate-300 hover:border-slate-400';
                statusText = 'Đang có khách';
              } else if (table.status === 'CALLING_STAFF') {
                cardStyle = 'bg-amber-50 text-amber-900 border-2 border-amber-400 animate-pulse hover:border-amber-500 shadow-sm';
                statusText = '🔔 Gọi phục vụ';
              } else if (table.status === 'BILL_REQUESTED') {
                cardStyle = 'bg-red-50 text-red-900 border-2 border-red-500 animate-pulse font-extrabold hover:border-red-600 shadow-md';
                statusText = '💳 Yêu cầu tính tiền';
              }

              const isOccupied = table.status !== 'EMPTY';

              return (
                <div
                  key={table.id}
                  className={`p-3.5 rounded-xl border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between select-none ${cardStyle}`}
                >
                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base sm:text-lg">{formatTableName(table.tableNumber)}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/90 border border-slate-200 shadow-2xs">
                        {table.zone}
                      </span>
                    </div>

                    <div className="space-y-1 mt-2">
                      <p className="text-xs font-semibold">{statusText}</p>
                      {Boolean(table.occupiedMinutes) && (
                        <p className="text-[11px] font-mono opacity-75 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {table.occupiedMinutes} phút
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total & Action Buttons Area */}
                  <div className="mt-3 pt-2 border-t border-slate-200/80 space-y-2">
                    {table.totalAmount ? (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">Tạm tính:</span>
                        <span className="font-black text-sm text-slate-900">{formatVND(table.totalAmount)}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Bàn đang trống</div>
                    )}

                    {/* 2 NÚT THAO TÁC: 1. CHI TIẾT | 2. THANH TOÁN */}
                    {isOccupied ? (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => handleOpenDetailModal(table)}
                          className="h-8 px-2 rounded-lg bg-white border border-slate-300 hover:border-orange-400 text-slate-700 hover:text-orange-600 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-600" />
                          <span>Chi tiết</span>
                        </button>

                        <button
                          onClick={() => handleOpenCheckoutModal(table)}
                          className="h-8 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Thanh toán</span>
                        </button>
                      </div>
                    ) : (
                      <div className="h-8 flex items-center justify-center text-[11px] text-slate-400 font-medium bg-white/60 rounded-lg border border-slate-200">
                        Sẵn sàng đón khách
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. MODAL CHI TIẾT MÓN ĐÃ ĐẶT */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>📋 Chi Tiết Các Món Đã Đặt - {formatTableName(selectedDetailTable?.tableNumber)}</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={560}
        footer={null}
      >
        {selectedDetailTable && (
          <div className="space-y-4 pt-2 text-xs font-sans">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900 text-sm">{formatTableName(selectedDetailTable.tableNumber)} • {selectedDetailTable.zone}</p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Mã đơn: {selectedDetailTable.currentOrderCode || '#ORD-8821'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold text-xs">
                {selectedDetailTable.occupiedMinutes || 24} phút
              </span>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Danh sách món ăn:</p>
              {fetchingOrder ? (
                <div className="p-6 text-center text-slate-500">Đang tải danh sách món ăn từ DB...</div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white max-h-[300px] overflow-y-auto custom-scrollbar">
                  {getOrdersForTable(selectedDetailTable.tableNumber).map((item, idx) => (
                    <div key={idx} className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50">
                      <div className="space-y-0.5 flex-1">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{item.name}</p>
                        {item.note && (
                          <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-900">
                          {formatVND(item.price)} <span className="text-orange-600">x{item.quantity}</span>
                        </p>
                        <p className="font-black text-xs text-slate-900">
                          {formatVND(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
              <span className="font-bold text-orange-950 text-sm">TỔNG TIỀN TẠM TÍNH:</span>
              <span className="font-black text-xl text-orange-600">
                {formatVND(getTableTotalAmount(selectedDetailTable))}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => message.info('Đang in hóa đơn tạm tính...')}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>In Tạm Tính</span>
              </button>
              <button
                onClick={handleSwitchToCheckout}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>Chuyển Sang Thanh Toán</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. MODAL THANH TOÁN REFACTORED (CỦA NHÀ HÀNG - HỖ TRỢ ĐỒNG BỘ 2 CỘT VIETQR PRO CHUẨN UX/UI) */}
      {selectedCheckoutTable && (
        <PaymentCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          tableName={formatTableName(selectedCheckoutTable.tableNumber)}
          totalAmount={getTableTotalAmount(selectedCheckoutTable)}
          orderItems={getOrdersForTable(selectedCheckoutTable.tableNumber)}
          orderCode={selectedCheckoutTable.currentOrderCode || '#ORD-8821'}
          onConfirmCashPayment={async (received) => {
            setCashReceived(received);
            await handleConfirmCompletePayment(selectedCheckoutTable.id, 'CASH');
          }}
          onGenerateQr={handleGenerateVietQR}
          isGeneratingQr={isGeneratingQr}
          checkoutUrl={checkoutUrl}
          qrCodeImageUrl={qrCodeImageUrl}
          qrPaymentStatus={qrPaymentStatus}
          onCancelQrPayment={handleCancelQrPayment}
          accountInfo={accountInfo}
        />
      )}
    </div>
  );
};
