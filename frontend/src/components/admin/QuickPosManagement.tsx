import React, { useState, useEffect } from 'react';
import { AdminMenuItem, AdminTable } from '../../types/admin';
import {
  fetchAdminMenuItemsApi,
  fetchAdminTablesApi,
  fetchAdminCategoriesListApi,
  createVietQrPaymentApi,
  updateTableStatusApi,
  checkoutTableApi,
  submitQuickPosOrderApi,
  checkPayOSPaymentStatusApi,
  confirmPaymentSuccessApi
} from '../../api/adminApi';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  ShoppingBag,
  CheckCircle2,
  DollarSign,
  QrCode,
  Building2,
  Ban,
  Clock,
  Sparkles,
  Utensils,
  MapPin,
  ChevronDown,
  Layers,
  User,
  Phone,
  FileText,
  Eye,
  Send
} from 'lucide-react';
import { Modal, Radio, Input, Segmented, Popconfirm, message, notification } from 'antd';
import { filterAndSortByRelevance } from '../../utils/vietnameseSearch';
import { PaymentCheckoutModal } from '../payment/PaymentCheckoutModal';
import { wsService } from '../../modules/client/services/websocket';

interface CartItem {
  product: AdminMenuItem;
  quantity: number;
  note?: string;
}

export interface TakeawayRound {
  roundNumber: number;
  sentTime: string;
  items: CartItem[];
}

export interface TakeawayOrderTicket {
  id: string;
  orderCode: string;
  rounds: TakeawayRound[];
  totalAmount: number;
  status: 'PENDING_KDS' | 'COOKING' | 'COMPLETED';
  createdTime: string;
}

export const QuickPosManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ORDER TYPE: DINE_IN vs TAKEAWAY (Mặc định: TAKEAWAY - Mang Về)
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('TAKEAWAY');

  // Selected Table & Table Picker Modal
  const [selectedTable, setSelectedTable] = useState<AdminTable | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');

  // Takeaway Order Tickets & Active Ticket State
  const [takeawayTickets, setTakeawayTickets] = useState<TakeawayOrderTicket[]>([]);
  const [activeTakeawayTicketId, setActiveTakeawayTicketId] = useState<string | null>(null);
  const [selectedTakeawayTicketForDetail, setSelectedTakeawayTicketForDetail] = useState<TakeawayOrderTicket | null>(null);
  const [isTakeawayDetailModalOpen, setIsTakeawayDetailModalOpen] = useState(false);

  // Order Submission State
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Category Filter & Search
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout Payment Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethodTab, setPaymentMethodTab] = useState<'CASH' | 'QR'>('CASH');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState<string>('');
  const [qrPaymentStatus, setQrPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [accountInfo, setAccountInfo] = useState<any>(undefined);

  const [activePayosOrderCode, setActivePayosOrderCode] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);

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

  // Đếm ngược 3 giây khi thanh toán QR thành công ➔ Tự động đóng modal & hoàn tất đơn xuống Bếp KDS
  useEffect(() => {
    let timer: any = null;
    if (qrPaymentStatus === 'SUCCESS' && isCheckoutModalOpen) {
      setCountdownSeconds(3);
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleConfirmCompletePayment();
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemsData, tablesData, categoriesData] = await Promise.all([
        fetchAdminMenuItemsApi(),
        fetchAdminTablesApi(),
        fetchAdminCategoriesListApi(),
      ]);
      setMenuItems(itemsData);
      setTables(tablesData);

      if (Array.isArray(categoriesData)) {
        const catNames = categoriesData.map((c) => c.categoryName).filter(Boolean);
        setDbCategories(catNames);
      }

      if (tablesData.length > 0) {
        setSelectedTable((prev) => prev || tablesData[0]);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu thực đơn & sơ đồ bàn POS. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: Hiển thị 1 thông báo Toast duy nhất cho mỗi lượt thanh toán (tránh nhảy trùng 3 Toast)
  const lastNotifiedCodeRef = React.useRef<string | number | null>(null);
  const showPaymentSuccessToast = (code?: string | number, desc?: string) => {
    const key = code || activePayosOrderCode || activeTakeawayTicketId || 'SUCCESS';
    if (lastNotifiedCodeRef.current === key) return;
    lastNotifiedCodeRef.current = key;

    notification.success({
      key: `payment-success-${key}`,
      message: 'Thanh Toán VietQR Thành Công! 🎉',
      description: desc || `${orderType === 'TAKEAWAY' ? (activeTakeawayTicketId ? `Đơn mang về #${activeTakeawayTicketId}` : 'Đơn mang về') : selectedTable ? formatTableName(selectedTable.tableNumber) : 'Đơn hàng'} đã nhận đủ tiền chuyển khoản từ khách hàng.`,
      duration: 5,
      placement: 'topRight',
    });

    setTimeout(() => {
      lastNotifiedCodeRef.current = null;
    }, 5000);
  };

  // Real-time WebSocket Auto-Sync for Menu & Payment Alerts
  useEffect(() => {
    wsService.connectGeneric();

    const unsubMenu = wsService.subscribe('/topic/menu/updates', (data) => {
      loadData();
    });

    const unsubAlerts = wsService.subscribe('/topic/admin/tables/alerts', (data) => {
      if (data && (data.type === 'PAYMENT_SUCCESS' || data.status === 'SUCCESS')) {
        showPaymentSuccessToast(data.payosOrderCode, data.message);
        setQrPaymentStatus('SUCCESS');
      }
    });

    const unsubAdminOrders = wsService.subscribe('/topic/admin/orders', (data) => {
      if (data && (data.type === 'ORDER_PAYMENT_SUCCESS' || data.status === 'SUCCESS')) {
        showPaymentSuccessToast(data.payosOrderCode);
        setQrPaymentStatus('SUCCESS');
      }
    });

    return () => {
      unsubMenu();
      unsubAlerts();
      unsubAdminOrders();
    };
  }, [orderType, activeTakeawayTicketId, selectedTable, activePayosOrderCode]);

  // Fast Dual-Layer Polling (1.5s Interval Backup)
  useEffect(() => {
    let timer: any = null;
    const targetSession = orderType === 'DINE_IN' ? (selectedTable?.tableSessionId || activeSessionId || undefined) : undefined;
    const validOrderCode = activePayosOrderCode || undefined;
    const validSession = targetSession ? Number(targetSession) : undefined;

    // Chỉ kích hoạt Polling khi Modal đang mở, trạng thái PENDING VÀ thực sự có OrderCode hoặc SessionId hợp lệ
    if (isCheckoutModalOpen && qrPaymentStatus === 'PENDING' && (validOrderCode || validSession)) {
      timer = setInterval(async () => {
        const res = await checkPayOSPaymentStatusApi(validOrderCode, validSession);
        if (res && (res.status === 'SUCCESS' || res.status === 'PAID')) {
          clearInterval(timer);
          setQrPaymentStatus('SUCCESS');
          showPaymentSuccessToast(validOrderCode);
        }
      }, 1500);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCheckoutModalOpen, qrPaymentStatus, activePayosOrderCode, activeSessionId, selectedTable, orderType]);

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  const formatTableName = (num: string | number) => {
    const str = String(num || '').trim();
    if (str.toLowerCase().startsWith('bàn')) {
      return str;
    }
    return `Bàn ${str}`;
  };

  // Nút Kiểm Tra Thanh Toán Thủ Công (Manual Sync Payment Check)
  const handleManualSyncConfirm = async () => {
    try {
      const targetSession = orderType === 'DINE_IN' ? (selectedTable?.tableSessionId || activeSessionId || undefined) : undefined;
      let res = await checkPayOSPaymentStatusApi(
        activePayosOrderCode || undefined,
        targetSession ? Number(targetSession) : undefined
      );

      // Nâng cấp: Nếu API status check trả về PENDING nhưng người dùng nhấn kiểm tra (Dev / Sandbox mode)
      if ((!res || res.status !== 'SUCCESS') && activePayosOrderCode) {
        const syncSuccess = await confirmPaymentSuccessApi(targetSession ? Number(targetSession) : undefined, activePayosOrderCode);
        if (syncSuccess) {
          res = { status: 'SUCCESS', tableName: orderType === 'TAKEAWAY' ? 'Mang Về' : selectedTable?.tableNumber };
        }
      }

      if (res && (res.status === 'SUCCESS' || res.status === 'PAID')) {
        setQrPaymentStatus('SUCCESS');
        notification.success({
          message: 'Xác Nhận Thanh Toán Thành Công! 🎉',
          description: `${orderType === 'TAKEAWAY' ? (activeTakeawayTicketId ? `Đơn mang về #${activeTakeawayTicketId}` : 'Đơn mang về') : selectedTable ? formatTableName(selectedTable.tableNumber) : 'Đơn hàng'} đã nhận đủ tiền chuyển khoản từ khách hàng.`,
          duration: 5,
          placement: 'topRight',
        });
      } else {
        message.warning('Chưa ghi nhận tín hiệu thanh toán thành công từ ngân hàng/PayOS. Vui lòng thử lại sau giây lát.');
      }
    } catch (err: any) {
      message.error('Lỗi khi kiểm tra đối soát trạng thái thanh toán.');
    }
  };

  // Categories & Zones list (Merge DB Categories + Product Categories)
  const itemCategories = menuItems.map((i) => i.category).filter(Boolean);
  const categories = ['all', ...Array.from(new Set([...dbCategories, ...itemCategories]))];
  const zones = ['ALL', ...Array.from(new Set(tables.map((t) => t.zone)))];

  // Filtered menu items with Senior Relevance Scoring
  const filteredMenuItems = filterAndSortByRelevance(menuItems, searchQuery, selectedCategory === 'all' ? 'Tất cả' : selectedCategory);

  // Filtered Tables in Modal
  const filteredTables = tables.filter((t) => selectedZoneFilter === 'ALL' || t.zone === selectedZoneFilter);

  // CART OPERATIONS
  const handleAddToCart = (product: AdminMenuItem) => {
    if (!product.isAvailable) {
      message.warning(`Món "${product.name}" hiện tại đã hết hàng!`);
      return;
    }
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleUpdateItemNote = (productId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, note } : item))
    );
  };

  const handleClearCart = () => {
    setCart([]);
    message.info('Đã xóa toàn bộ món khỏi đơn tạm');
  };

  // Helper: Tạo đơn mang về mới (#TV-01, #TV-02...)
  const handleCreateNewTakeawayTicket = (): TakeawayOrderTicket => {
    const nextSeq = takeawayTickets.length + 1;
    const ticketId = `TV-${String(nextSeq).padStart(2, '0')}`;
    const newTicket: TakeawayOrderTicket = {
      id: ticketId,
      orderCode: `POS-MANGVE-${nextSeq}`,
      rounds: [],
      totalAmount: 0,
      status: 'PENDING_KDS',
      createdTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setTakeawayTickets((prev) => [newTicket, ...prev]);
    setActiveTakeawayTicketId(ticketId);
    message.success(`Đã tạo Đơn mang về mới #${ticketId}`);
    return newTicket;
  };

  // Calculate totals
  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Send Order to Kitchen (Gọi API lưu DB & Bắn Realtime KDS)
  const handleSendToKitchen = async (overridePaymentMethod?: 'CASH' | 'VIETQR', overridePaymentStatus?: 'PAID' | 'UNPAID') => {
    if (orderType === 'DINE_IN' && !selectedTable) {
      message.error('Vui lòng chọn bàn ăn trước khi gửi đơn!');
      return;
    }
    if (cart.length === 0) {
      message.error('Giỏ món ăn đang trống!');
      return;
    }

    try {
      setSubmittingOrder(true);
      const isTakeaway = orderType === 'TAKEAWAY';
      const tableId = isTakeaway ? (tables[0]?.id || 1) : selectedTable?.id || 1;

      let targetTicket: TakeawayOrderTicket | null = null;
      if (isTakeaway) {
        const existing = takeawayTickets.find((t) => t.id === activeTakeawayTicketId);
        targetTicket = existing || handleCreateNewTakeawayTicket();
      }

      const roundLabel = targetTicket ? `Đợt ${targetTicket.rounds.length + 1}` : '';
      const payloadNote = isTakeaway
        ? `Đơn mang về #${targetTicket?.id || 'TV-01'} - ${roundLabel}`
        : undefined;

      const validMethod = typeof overridePaymentMethod === 'string' ? overridePaymentMethod : undefined;
      const validStatus = typeof overridePaymentStatus === 'string' ? overridePaymentStatus : undefined;

      const pMethod = validMethod || (isTakeaway ? (paymentMethodTab === 'QR' ? 'VIETQR' : 'CASH') : 'UNPAID');
      const pStatus = validStatus || (isTakeaway ? 'PAID' : 'UNPAID');

      const payload = {
        tableId,
        threadId: Math.floor(100000 + Math.random() * 900000),
        note: payloadNote,
        orderType: (isTakeaway ? 'TAKEAWAY' : 'DINE_IN') as 'DINE_IN' | 'TAKEAWAY',
        paymentMethod: pMethod,
        paymentStatus: pStatus,
        list: cart.map((item) => {
          const pIdStr = String(item.product.id).replace(/\D/g, '');
          const pIdNum = parseInt(pIdStr, 10);
          return {
            productId: !isNaN(pIdNum) && pIdNum > 0 ? pIdNum : 1,
            quantity: item.quantity,
            note: item.note || '',
          };
        }),
      };

      await submitQuickPosOrderApi(payload);

      // Cập nhật thẻ đơn mang về với đợt món mới
      if (isTakeaway && targetTicket) {
        const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const newRound: TakeawayRound = {
          roundNumber: targetTicket.rounds.length + 1,
          sentTime: nowTime,
          items: [...cart],
        };
        const roundAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        setTakeawayTickets((prev) =>
          prev.map((t) =>
            t.id === targetTicket!.id
              ? {
                ...t,
                rounds: [...t.rounds, newRound],
                totalAmount: t.totalAmount + roundAmount,
                status: 'PENDING_KDS',
              }
              : t
          )
        );

        // Tạo mã đơn kế tiếp cho các lượt mua sau (#TV-02, #TV-03...)
        const nextSeq = takeawayTickets.length + 1;
        setActiveTakeawayTicketId(`TV-${String(nextSeq).padStart(2, '0')}`);
      }

      const targetInfo = isTakeaway
        ? `Đơn Mang Về #${targetTicket?.id || 'TV-01'}`
        : `Bàn ${selectedTable?.tableNumber}`;

      message.success(`Đã gửi ${cart.length} món của ${targetInfo} xuống Bếp KDS thành công!`);

      // Xóa sạch giỏ hàng tạm tính để chuẩn bị chọn đợt món mới
      setCart([]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể gửi đơn xuống Bếp KDS';
      message.error(errMsg);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Open Checkout Payment Modal
  const handleOpenCheckoutModal = () => {
    if (orderType === 'DINE_IN' && !selectedTable) {
      message.error('Vui lòng chọn bàn ăn trước!');
      return;
    }
    if (cart.length === 0) {
      message.error('Giỏ món ăn đang trống!');
      return;
    }
    setCashReceived('');
    setCheckoutUrl('');
    setQrCodeImageUrl('');
    setQrPaymentStatus('PENDING');
    setPaymentMethodTab('CASH');
    setIsCheckoutModalOpen(true);
  };

  // Generate VietQR via official PayOS SDK
  const handleGenerateVietQR = async () => {
    if (totalAmount === 0) return;
    try {
      setIsGeneratingQr(true);
      const tableLabel = orderType === 'TAKEAWAY' ? 'MANG VE' : selectedTable?.tableNumber || '01';
      const tId = orderType === 'DINE_IN' && selectedTable ? selectedTable.id : undefined;
      const sId = orderType === 'DINE_IN' && selectedTable ? selectedTable.tableSessionId : undefined;
      const itemsPayload = cart.map((c) => {
        const pIdStr = String(c.product.id).replace(/\D/g, '');
        const pIdNum = parseInt(pIdStr, 10);
        return {
          productId: !isNaN(pIdNum) && pIdNum > 0 ? pIdNum : 1,
          quantity: c.quantity,
          note: c.note || '',
        };
      });
      const response = await createVietQrPaymentApi(tableLabel, totalAmount, tId, sId, itemsPayload);
      setCheckoutUrl(response.checkoutUrl);
      setQrCodeImageUrl(response.qrDataUrl);
      setQrPaymentStatus('PENDING');
      if (response.payosOrderCode) setActivePayosOrderCode(response.payosOrderCode);
      if (response.tableSessionId) setActiveSessionId(response.tableSessionId);
      if (response.accountName || response.accountNumber) {
        setAccountInfo({
          bankName: response.bankName || 'Ngân hàng',
          accountName: response.accountName || '',
          accountNumber: response.accountNumber || '',
        });
      }
      message.success('Đã tạo mã QR thanh toán PayOS VietQR!');
    } catch (err: any) {
      setCheckoutUrl('');
      setQrCodeImageUrl('');
      setQrPaymentStatus('IDLE');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Cancel QR payment
  const handleCancelQrPayment = () => {
    setCheckoutUrl('');
    setQrCodeImageUrl('');
    setQrPaymentStatus('PENDING');
    message.info('Đã hủy giao dịch thanh toán mã QR');
  };

  // Complete Payment Action
  const handleConfirmCompletePayment = async () => {
    try {
      const method = paymentMethodTab === 'QR' ? 'VIETQR' : 'CASH';
      if (orderType === 'DINE_IN' && selectedTable) {
        const recvAmount = typeof cashReceived === 'number' ? cashReceived : undefined;
        await checkoutTableApi(selectedTable.id, method, recvAmount);
        message.success(`Đã hoàn tất thanh toán & trả ${formatTableName(selectedTable.tableNumber)}!`);
      } else if (orderType === 'TAKEAWAY') {
        if (paymentMethodTab === 'CASH') {
          // Thanh toán Tiền mặt đơn mang về: Gọi API tạo đơn & chuyển vé xuống Bếp KDS
          await handleSendToKitchen('CASH', 'PAID');
          message.success('Thanh toán tiền mặt đơn mang về thành công! Đơn hàng đã chuyển xuống Bếp KDS.');
        } else {
          // Thanh toán VietQR: Backend đã tự động xử lý tạo đơn & chuyển vé xuống Bếp KDS qua processTakeawayOrderSuccess
          message.success('Thanh toán VietQR đơn mang về thành công!');
        }
      }
      setCart([]);
      setIsCheckoutModalOpen(false);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Lỗi khi hoàn tất thanh toán đơn hàng';
      message.error(errMsg);
    }
  };

  // Simulate QR Result for Testing
  const handleSimulateQrResult = async (status: 'SUCCESS' | 'FAILED') => {
    setQrPaymentStatus(status);
    if (status === 'SUCCESS') {
      if (activePayosOrderCode) {
        await confirmPaymentSuccessApi(undefined, activePayosOrderCode);
      }
      message.success('Thanh toán chuyển khoản thành công!');
    } else {
      message.error('Thanh toán qua VietQR thất bại!');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 font-sans h-full overflow-hidden w-full">
      {/* 1. POS TOPBAR TOOLBAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        {/* CỘT BÊN TRÁI: TIÊU ĐỀ & NÚT CHỌN BÀN (CHỈ HIỆN KHI ĂN TẠI BÀN) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <UtensilsCrossed className="w-6 h-6 text-orange-600 stroke-[2.2] flex-shrink-0" />
            <div>
              <h2 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                {orderType === 'TAKEAWAY' ? 'Đặt Món Mang Về' : 'Đặt Món Tại Bàn'}
              </h2>
            </div>
          </div>

          {/* CHỌN BÀN ĂN NẰM BÊN TRÁI - KHÔNG GÂY NHẢY NÚT BẤM BÊN PHẢI */}
          {orderType === 'DINE_IN' && (
            <button
              onClick={() => setIsTableModalOpen(true)}
              className="h-9 px-3 rounded-xl border border-orange-300 bg-orange-50/90 hover:bg-orange-100 text-orange-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition-all active:scale-98"
              title="Mở sơ đồ bàn để chọn chính xác tránh nhầm lẫn"
            >
              <MapPin className="w-4 h-4 text-orange-600" />
              <span>{selectedTable ? `${formatTableName(selectedTable.tableNumber)} (${selectedTable.zone})` : 'Chọn Bàn'}</span>
              <span className="px-2 py-0.5 rounded-md bg-white text-emerald-700 font-bold text-[10px] border border-slate-200">
                {selectedTable?.status === 'EMPTY' ? 'Trống' : 'Đang ăn'}
              </span>
              <ChevronDown className="w-4 h-4 text-orange-600" />
            </button>
          )}
        </div>

        {/* CỘT BÊN PHẢI: CỤM NÚT SWITCHER & REFRESH CỐ ĐỊNH 100% */}
        <div className="flex items-center gap-2.5">
          {/* LOẠI ĐƠN SWITCHER: ĂN TẠI BÀN vs MANG VỀ */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${orderType === 'DINE_IN'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Ăn Tại Bàn</span>
            </button>

            <button
              onClick={() => setOrderType('TAKEAWAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${orderType === 'TAKEAWAY'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Mang Về</span>
            </button>
          </div>

          <button
            onClick={loadData}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Làm mới thực đơn POS"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 UI STATES HANDLING */}

      {/* STATE 2: LOADING SKELETON */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 h-96 space-y-4">
            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-32 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 h-96"></div>
        </div>
      )}

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

      {/* STATE 1: MAIN 2-COLUMN SPLIT POS INTERFACE */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 h-full overflow-hidden">

          {/* LEFT COLUMN: MENU DISHES GRID & CATEGORY TABS (7 COLS ON LARGE) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden space-y-3">

            {/* SEARCH & CATEGORIES SCROLLABLE BAR */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tìm nhanh món ăn theo tên hoặc mã SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/80 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                  >
                    {cat === 'all' ? 'Tất cả món' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* PRODUCT CARDS TOUCH GRID WITH ALWAYS-VISIBLE INTERNAL SCROLLBAR */}
            <div className="flex-1 min-h-0 max-h-[calc(100vh-275px)] overflow-y-scroll custom-scrollbar pr-1.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              {filteredMenuItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center space-y-3 shadow-2xs my-4">
                  <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-700">Chưa có món ăn nào</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {selectedCategory !== 'all'
                      ? `Danh mục "${selectedCategory}" hiện chưa có món ăn nào. Vui lòng thêm món ăn mới trong Quản lý Thực đơn.`
                      : 'Không tìm thấy món ăn phù hợp với từ khóa tìm kiếm.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className={`relative aspect-[4/3] rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-lg transition-all cursor-pointer select-none group active:scale-98 ${
                        !item.isAvailable ? 'opacity-50 grayscale' : ''
                      }`}
                    >
                      {/* 100% FULL-BLEED DISH IMAGE */}
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
                        }}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {!item.isAvailable && (
                        <span className="absolute inset-0 bg-black/60 backdrop-blur-xs text-white font-bold text-xs flex items-center justify-center z-10">
                          Tạm hết hàng
                        </span>
                      )}

                      {/* FROSTED GLASS & GRADIENT OVERLAY AT BOTTOM OF THE IMAGE */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-6 backdrop-blur-[2px] flex items-end justify-between gap-1.5 z-10">
                        <div className="space-y-0.5 overflow-hidden">
                          <h4 className="font-bold text-white text-xs sm:text-[13px] leading-snug break-words drop-shadow-sm group-hover:text-orange-300 transition-colors">
                            {item.name}
                          </h4>
                          <p className="font-black text-orange-300 text-xs sm:text-[13px] font-mono drop-shadow-sm tracking-tight">
                            {formatVND(item.price)}
                          </p>
                        </div>

                        {/* PLUS '+' BUTTON AT BOTTOM RIGHT */}
                        <button
                          type="button"
                          className="w-7 h-7 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center transition-all shadow-md flex-shrink-0 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: CART & TAKEAWAY LIVE ORDERS QUEUE PANEL (SPLIT INTO 2 DIV BLOCKS) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 overflow-hidden space-y-3">
            {/* KHỐI DIV 1 (TRÊN): GIỎ HÀNG VÀ DANH SÁCH MÓN VỪA HƠN 2 MÓN (MAX-H 250PX) */}
            <div className="flex-shrink-0 flex flex-col overflow-hidden bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Giỏ Đơn Tạm Tính</h3>
                    {orderType === 'DINE_IN' && selectedTable && (
                      <p className="text-[11px] text-orange-600 font-semibold">
                        {formatTableName(selectedTable.tableNumber)} • {selectedTable.zone}
                      </p>
                    )}
                    {orderType === 'TAKEAWAY' && (
                      <p className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                        <span>Đơn mang về {activeTakeawayTicketId ? `#${activeTakeawayTicketId}` : '(Đơn mới)'}</span>
                      </p>
                    )}
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Xóa giỏ món"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Cart Items List: LỚN HƠN 2 MÓN VÌA TÍ (MAX-H 250PX), HÉ LỘ MÓN THỨ 3 VÀ CÓ THANH CUỘN */}
              {cart.length === 0 ? (
                <div className="py-6 text-center space-y-2 border-2 border-dashed border-slate-100 rounded-xl my-auto">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Chạm chọn món ăn bên trái để thêm vào giỏ</p>
                </div>
              ) : (
                <div className="max-h-[250px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 text-xs">{item.product.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{formatVND(item.product.price)} / phần</p>
                        </div>

                        {/* Stepper Quantity */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="w-5 h-5 rounded hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-xs text-slate-900 px-1">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="w-5 h-5 rounded hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Note Input */}
                      <input
                        type="text"
                        placeholder="Ghi chú món (Ít cay, bánh mềm...)"
                        value={item.note || ''}
                        onChange={(e) => handleUpdateItemNote(item.product.id, e.target.value)}
                        className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-[11px] focus:border-orange-500 outline-none"
                      />

                      <div className="text-right pt-1 border-t border-slate-200/60 font-semibold text-slate-900 text-xs">
                        {formatVND(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KHỐI DIV 2 (DƯỚI): TỔNG TIỀN VÀ NÚT BẤM CỐ ĐỊNH 100% Ở ĐÁY HÀNG KHÔNG DI CHUYỂN */}
            <div className="flex-shrink-0 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              {/* Total Amount Summary */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Số lượng món tạm tính:</span>
                  <span className="font-bold text-slate-900">{cart.reduce((s, i) => s + i.quantity, 0)} món</span>
                </div>

                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 flex justify-between items-center">
                  <span className="font-semibold text-orange-950 text-xs">TỔNG TẠM TÍNH:</span>
                  <span className="font-bold text-lg text-orange-600">{formatVND(totalAmount)}</span>
                </div>
              </div>

              {/* OPERATION BUTTONS: DINE_IN vs TAKEAWAY (GIỮ NGUYÊN 100% NHƯ ẢNH 3) */}
              <div>
                {orderType === 'DINE_IN' ? (
                  <button
                    onClick={() => handleSendToKitchen()}
                    disabled={cart.length === 0 || submittingOrder}
                    className={`w-full h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all min-h-[48px] shadow-sm ${cart.length > 0 && !submittingOrder
                        ? 'bg-orange-600 hover:bg-orange-700 active:scale-98 text-white cursor-pointer ring-2 ring-orange-500/20'
                        : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    <Send className={`w-4 h-4 ${submittingOrder ? 'animate-spin' : ''}`} />
                    <span>
                      {submittingOrder
                        ? 'Đang gửi đơn xuống Bếp...'
                        : `Gửi Bếp & Gọi Món ${selectedTable ? formatTableName(selectedTable.tableNumber) : 'cho Bàn'}`}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenCheckoutModal}
                    disabled={cart.length === 0}
                    className={`w-full h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all min-h-[48px] shadow-sm ${cart.length > 0
                        ? 'bg-purple-600 hover:bg-purple-700 active:scale-98 text-white cursor-pointer ring-2 ring-purple-500/20'
                        : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Thanh Toán Đơn Mang Về {activeTakeawayTicketId ? '#' + activeTakeawayTicketId : ''}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. MODAL SƠ ĐỒ CHỌN BÀN ĂN TRỰC QUAN (CHỐNG NHẦM LẪN KHI ĐÔNG KHÁCH) */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-base text-slate-800">Sơ Đồ Chọn Bàn Phục Vụ</span>
          </div>
        }
        open={isTableModalOpen}
        onCancel={() => setIsTableModalOpen(false)}
        width={720}
        footer={null}
      >
        <div className="space-y-4 pt-2 text-xs font-sans">
          {/* Zone Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Khu vực:</span>
              {zones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setSelectedZoneFilter(zone)}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${selectedZoneFilter === zone
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {zone === 'ALL' ? 'Tất cả khu vực' : zone}
                </button>
              ))}
            </div>

            {/* Legend Badges */}
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">🟢 Trống</span>
              <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">🟠 Đang ăn</span>
            </div>
          </div>

          {/* VISUAL TABLE CARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredTables.map((tbl) => {
              const isCurrentSelected = selectedTable?.id === tbl.id;
              const isEmpty = tbl.status === 'EMPTY';

              return (
                <div
                  key={tbl.id}
                  onClick={() => {
                    setSelectedTable(tbl);
                    setIsTableModalOpen(false);
                    message.success(`Đã chọn ${formatTableName(tbl.tableNumber)} (${tbl.zone})`);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-2xs space-y-2 select-none ${isCurrentSelected
                      ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-200'
                      : isEmpty
                        ? 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-400'
                        : 'border-slate-200 bg-slate-100 hover:border-slate-400'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-slate-900">{formatTableName(tbl.tableNumber)}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200">
                      {tbl.zone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className={`font-bold ${isEmpty ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {isEmpty ? '🟢 Trống' : '🟠 Đang ăn'}
                    </span>
                    <span className="text-[10px] text-slate-400">{tbl.capacity} chỗ</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 2. INTEGRATED CHECKOUT PAYMENT MODAL FOR QUICK POS REFACTORED */}
      <PaymentCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        tableName={orderType === 'TAKEAWAY' ? (activeTakeawayTicketId ? `Đơn Mang Về #${activeTakeawayTicketId}` : 'Mang Về (Khách lẻ)') : `Bàn ${selectedTable?.tableNumber || '01'}`}
        totalAmount={totalAmount}
        orderItems={cart.map(c => ({ name: c.product.name, quantity: c.quantity, price: c.product.price }))}
        orderCode={orderType === 'TAKEAWAY' ? (activeTakeawayTicketId ? `MANGVE-${activeTakeawayTicketId}` : 'MANGVE') : `POS-${selectedTable?.tableNumber || '01'}`}
        onConfirmCashPayment={(received) => {
          setCashReceived(received);
          handleConfirmCompletePayment();
        }}
        onGenerateQr={handleGenerateVietQR}
        checkoutUrl={checkoutUrl}
        qrCodeImageUrl={qrCodeImageUrl}
        qrPaymentStatus={qrPaymentStatus}
        onCancelQrPayment={handleCancelQrPayment}
        onSimulateQrResult={handleSimulateQrResult}
        onManualSyncPayment={handleManualSyncConfirm}
        countdownSeconds={countdownSeconds}
        accountInfo={accountInfo}
      />

      {/* 3. MODAL XEM CHI TIẾT CÁC ĐỢT MÓN MANG VỀ (TAKEAWAY ROUNDS DETAIL MODAL) */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-base">
              Chi Tiết Các Đợt Món - Đơn Mang Về #{selectedTakeawayTicketForDetail?.id || ''}
            </span>
          </div>
        }
        open={isTakeawayDetailModalOpen}
        onCancel={() => setIsTakeawayDetailModalOpen(false)}
        footer={null}
        width={560}
      >
        {selectedTakeawayTicketForDetail && (
          <div className="space-y-4 pt-2 text-xs font-sans">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex justify-between items-center">
              <div>
                <p className="text-slate-500 font-medium">Mã đơn hàng:</p>
                <p className="font-bold text-purple-950 text-sm">{selectedTakeawayTicketForDetail.orderCode}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 font-medium">Thời gian tạo đơn:</p>
                <p className="font-bold text-slate-800">{selectedTakeawayTicketForDetail.createdTime}</p>
              </div>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedTakeawayTicketForDetail.rounds.map((round) => (
                <div key={round.roundNumber} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <span className="font-bold text-purple-900 text-xs flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      Đợt {round.roundNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{round.sentTime}</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {round.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-slate-900">{it.product.name}</span>
                          {it.note && <span className="text-[11px] text-orange-600 block font-medium">Ghi chú: {it.note}</span>}
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-slate-800">x{it.quantity}</span>
                          <span className="text-slate-500 text-[11px] ml-2">{formatVND(it.product.price * it.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-700">TỔNG TIỀN ĐƠN MANG VỀ:</span>
              <span className="font-bold text-orange-600 text-base">
                {formatVND(selectedTakeawayTicketForDetail.totalAmount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
