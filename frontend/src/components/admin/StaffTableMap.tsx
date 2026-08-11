import React, { useState, useEffect } from 'react';
import { AdminTable, TableStatus } from '../../types/admin';
import {
  fetchAdminTablesApi,
  updateTableStatusApi,
  createVietQrPaymentApi,
  checkoutTableApi,
  fetchMasterTableOrderApi
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
import { Drawer, Modal, Tabs, message, Image as AntImage } from 'antd';

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

// Mock Items for active tables (Fallback)
const mockTableOrders: Record<string, OrderedItem[]> = {
  '02': [
    { name: 'Phở Bò Đặc Biệt (Bát Lớn)', quantity: 2, price: 85000, note: 'Ít hành, bánh phở mềm' },
    { name: 'Quẩy Giòn Chiên Nóng', quantity: 2, price: 10000 },
    { name: 'Trà Chanh Giã Tay HB', quantity: 3, price: 50000, note: '70% đường, ít đá' },
  ],
  '03': [
    { name: 'Bò Nướng Tảng Sốt Tiêu Đen', quantity: 3, price: 140000, note: 'Chín vừa Medium Rare' },
    { name: 'Rau Củ Nướng Ngũ Vị', quantity: 2, price: 50000 },
    { name: 'Bia Thủ Công IPA', quantity: 3, price: 20000 },
  ],
  '04': [
    { name: 'Bún Bò Huế Đặc Biệt', quantity: 4, price: 75000, note: 'Thêm giò heo' },
    { name: 'Cơm Tấm Sườn Bì Chả', quantity: 4, price: 70000 },
    { name: 'Nước Ép Dưa Hấu Tươi', quantity: 4, price: 85000 },
  ],
  '06': [
    { name: 'Lẩu Thái Hải Sản Thập Cẩm', quantity: 1, price: 850000, note: 'Cay vừa' },
    { name: 'Bò Nướng Tảng Sốt Tiêu Đen', quantity: 4, price: 140000 },
    { name: 'Trà Chanh Giã Tay HB', quantity: 8, price: 55000 },
  ],
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
  const [qrPaymentStatus, setQrPaymentStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminTablesApi();
      setTables(data);
    } catch (err) {
      setError('Không thể tải sơ đồ bàn phục vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();

    // Lắng nghe kênh WebSocket Realtime khi khách đặt món để đổi màu bàn tức thì không cần F5
    const unsub = wsService.subscribe('/topic/tables/floor-map', (data) => {
      if (data) {
        loadTables();
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

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

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

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
      message.success('Đã hoàn tất thanh toán & giải phóng bàn trong DB thành công!');
      setIsCheckoutModalOpen(false);
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
      const totalAmt = activeTableOrder?.totalPrice || selectedCheckoutTable.totalAmount || 340000;
      
      const response = await createVietQrPaymentApi(selectedCheckoutTable.tableNumber, totalAmt);
      
      setCheckoutUrl(response.checkoutUrl);
      setQrCodeImageUrl(response.qrDataUrl);
      setQrPaymentStatus('PENDING');
      message.success('Đã tạo mã QR thanh toán PayOS VietQR!');
    } catch (err) {
      message.error('Không thể tạo mã QR thanh toán VietQR');
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

  // Get orders list for a table (Real DB items with mock fallback)
  const getOrdersForTable = (tableNumber: string): OrderedItem[] => {
    if (activeTableOrder && Array.isArray(activeTableOrder.allTableItems) && activeTableOrder.allTableItems.length > 0) {
      return activeTableOrder.allTableItems.map((item: any) => ({
        name: item.productName || item.name || 'Món ăn',
        quantity: Number(item.quantity || 1),
        price: Number(item.priceProduct || item.price || 0),
        note: item.note || ''
      }));
    }
    const cleanNum = tableNumber.replace(/^bàn\s+/i, '').trim();
    return (
      mockTableOrders[cleanNum] || mockTableOrders[tableNumber] || [
        { name: 'Món ăn thực đơn (Phần tiêu chuẩn)', quantity: 2, price: 65000 },
        { name: 'Đồ uống gọi thêm', quantity: 2, price: 25000 },
      ]
    );
  };

  return (
    <div className="space-y-4 font-sans">
      {/* MAP STATUS LEGEND TOOLBAR STICKY */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 transition-all">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold text-sm text-slate-900">Sơ Đồ Phục Vụ & Trạng Thái Bàn Realtime</h3>
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
            onClick={loadTables}
            className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* STATE 1: SCROLLABLE TABLE GRID CONTAINER CARD ("Ô VUÔNG CUỘN THEO DẦN") */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 max-h-[calc(100vh-210px)] min-h-[420px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => {
              let cardStyle = 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-400';
              let statusText = 'Trống';

              if (table.status === 'OCCUPIED') {
                cardStyle = 'bg-slate-100 text-slate-900 border-slate-300 hover:border-slate-400';
                statusText = 'Đang có khách';
              } else if (table.status === 'CALLING_STAFF') {
                cardStyle = 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse hover:border-amber-400';
                statusText = '🔔 Gọi phục vụ';
              } else if (table.status === 'BILL_REQUESTED') {
                cardStyle = 'bg-red-50 text-red-900 border-red-300 font-bold hover:border-red-400';
                statusText = '💳 Yêu cầu tính tiền';
              }

              const isOccupied = table.status !== 'EMPTY';

              return (
                <div
                  key={table.id}
                  className={`p-4 rounded-xl border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between select-none ${cardStyle}`}
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
                      {table.occupiedMinutes && (
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
                {formatVND(activeTableOrder?.totalPrice || selectedDetailTable.totalAmount || 340000)}
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

      {/* 2. MODAL THANH TOÁN (CÓ NÚT "TẠO MÃ QR THANH TOÁN" RÕ RÀNG) */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>💳 Thanh Toán Hóa Đơn - {formatTableName(selectedCheckoutTable?.tableNumber)}</span>
          </div>
        }
        open={isCheckoutModalOpen}
        onCancel={() => setIsCheckoutModalOpen(false)}
        width={680}
        footer={null}
      >
        {selectedCheckoutTable && (
          <div className="space-y-4 pt-2 text-xs font-sans">
            {/* CHI TIẾT CÁC MÓN ĐÃ ĐẶT */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-orange-600" /> Chi tiết các món đã đặt:
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  Mã đơn: {selectedCheckoutTable.currentOrderCode || '#ORD-8821'}
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {getOrdersForTable(selectedCheckoutTable.tableNumber).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-none">
                    <span className="font-semibold text-slate-800">
                      {item.name} <span className="text-orange-600 font-bold">x{item.quantity}</span>
                    </span>
                    <span className="font-bold text-slate-900">{formatVND(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">TỔNG CẦN THANH TOÁN:</span>
                <span className="font-black text-lg text-emerald-600">
                  {formatVND(activeTableOrder?.totalPrice || selectedCheckoutTable.totalAmount || 340000)}
                </span>
              </div>
            </div>

            {/* TAB PHƯƠNG THỨC THANH TOÁN */}
            <div className="space-y-3">
              <label className="font-bold text-slate-700 block">Chọn Phương Thức Thanh Toán:</label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('CASH')}
                  className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethodTab === 'CASH'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>1. Thanh Toán Tiền Mặt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('QR')}
                  className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethodTab === 'QR'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-orange-600" />
                  <span>2. Thanh Toán Mã QR</span>
                </button>
              </div>

              {/* VIEW 1: THANH TOÁN TIỀN MẶT */}
              {paymentMethodTab === 'CASH' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nhập số tiền nhận của khách (VND) *
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 500000"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value ? Number(e.target.value) : '')}
                      className="w-full p-3 rounded-lg border border-slate-300 text-sm font-extrabold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
                    {[
                      activeTableOrder?.totalPrice || selectedCheckoutTable.totalAmount || 340000,
                      500000,
                      1000000,
                    ].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashReceived(amt)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        {formatVND(amt)}
                      </button>
                    ))}
                  </div>

                  {cashReceived !== '' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
                      <span className="font-bold text-emerald-950">TIỀN THỪA TRẢ LẠI KHÁCH:</span>
                      <span className="font-black text-base text-emerald-700">
                        {Number(cashReceived) >= (activeTableOrder?.totalPrice || selectedCheckoutTable.totalAmount || 340000)
                          ? formatVND(Number(cashReceived) - (activeTableOrder?.totalPrice || selectedCheckoutTable.totalAmount || 340000))
                          : 'Khách đưa thiếu tiền'}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => handleConfirmCompletePayment(selectedCheckoutTable.id, 'CASH')}
                    className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>Xác Nhận Đã Nhận Tiền Mặt & Clear Bàn</span>
                  </button>
                </div>
              )}

              {/* VIEW 2: THANH TOÁN MÃ QR */}
              {paymentMethodTab === 'QR' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 text-center shadow-2xs">
                  {/* BÁO LOADING KHI ĐANG GỌI API */}
                  {isGeneratingQr && (
                    <div className="py-8 space-y-3">
                      <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
                      <p className="font-semibold text-slate-700">Đang tạo mã QR thanh toán VietQR cho {formatTableName(selectedCheckoutTable.tableNumber)}...</p>
                    </div>
                  )}

                  {/* CHƯA TẠO QR: HIỂN THỊ NÚT BẤM "TẠO MÃ QR THANH TOÁN" */}
                  {!isGeneratingQr && !checkoutUrl && (
                    <div className="py-6 space-y-3 bg-slate-50 rounded-xl border border-slate-200">
                      <QrCode className="w-12 h-12 text-orange-600 mx-auto" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Thanh Toán Qua Mã QR VietQR / PayOS</h4>
                        <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                          Bấm nút bên dưới để tạo mã QR thanh toán theo đúng số tiền{' '}
                          <strong className="text-slate-900">{formatVND(activeTableOrder?.totalPrice || selectedCheckoutTable.totalAmount || 340000)}</strong> của bàn.
                        </p>
                      </div>

                      {/* NÚT BẤM CHÍNH THỨC: TẠO MÃ QR THANH TOÁN */}
                      <button
                        type="button"
                        onClick={handleGenerateVietQR}
                        className="h-11 px-6 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Tạo Mã QR Thanh Toán</span>
                      </button>
                    </div>
                  )}

                  {/* ĐÃ BẤM TẠO QR: KHUNG MÃ QR & TRẠNG THÁI */}
                  {!isGeneratingQr && checkoutUrl && (
                    <div className="space-y-3">
                      {/* 1. KHI ĐANG CHỜ THANH TOÁN (PENDING) */}
                      {qrPaymentStatus === 'PENDING' && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 inline-block w-full max-w-sm">
                          <div className="flex items-center justify-center gap-2 text-slate-800 font-bold text-xs border-b border-slate-200 pb-2">
                            <Building2 className="w-4 h-4 text-orange-600" />
                            <span>NHÀ HÀNG F&B DINE-IN • VIETQR</span>
                          </div>

                          <div className="p-2 bg-white rounded-xl border border-slate-200 inline-block shadow-2xs">
                            <img
                              src={qrCodeImageUrl}
                              alt="Mã QR VietQR"
                              className="w-52 h-52 mx-auto object-contain"
                            />
                          </div>

                          <div className="space-y-1 text-xs text-slate-600">
                            <p className="font-bold text-sm text-slate-900">
                              Số tiền: <span className="text-emerald-600 font-extrabold text-base">{formatVND(activeTableOrder?.totalPrice || selectedCheckoutTable.totalAmount || 340000)}</span>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200 text-slate-600 font-medium text-xs">
                            Đang chờ hệ thống xác nhận chuyển khoản...
                          </div>

                          {/* NÚT HỦY GIAO DỊCH QR */}
                          <div className="pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={handleCancelQrPayment}
                              className="w-full h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Ban className="w-3.5 h-3.5 text-slate-500" />
                              <span>Hủy Giao Dịch QR</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. KHI THANH TOÁN THÀNH CÔNG */}
                      {qrPaymentStatus === 'SUCCESS' && (
                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 text-center space-y-2 max-w-sm mx-auto shadow-2xs">
                          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto stroke-[2.5]" />
                          <h3 className="font-bold text-base text-emerald-900">Thanh toán thành công</h3>
                          <p className="text-xs text-emerald-700">
                            Đã nhận đủ {formatVND(selectedCheckoutTable.totalAmount || 340000)}. Đang hoàn tất đơn...
                          </p>
                        </div>
                      )}

                      {/* 3. KHI THANH TOÁN THẤT BẠI */}
                      {qrPaymentStatus === 'FAILED' && (
                        <div className="bg-red-50 border border-red-300 rounded-xl p-5 text-center space-y-3 max-w-sm mx-auto shadow-2xs">
                          <XCircle className="w-10 h-10 text-red-600 mx-auto stroke-[2.5]" />
                          <h3 className="font-bold text-base text-red-900">Thanh toán thất bại</h3>
                          <p className="text-xs text-red-700">
                            Giao dịch bị hủy hoặc không nhận được tiền chuyển khoản.
                          </p>

                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleGenerateVietQR}
                              className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer"
                            >
                              Tạo lại mã QR
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelQrPayment}
                              className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
