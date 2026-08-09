import React, { useState, useEffect } from 'react';
import { AdminMenuItem, AdminTable } from '../../types/admin';
import { fetchAdminMenuItemsApi, fetchAdminTablesApi, createVietQrPaymentApi, updateTableStatusApi } from '../../api/adminApi';
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
  Phone
} from 'lucide-react';
import { Modal, message } from 'antd';

interface CartItem {
  product: AdminMenuItem;
  quantity: number;
  note?: string;
}

export const QuickPosManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ORDER TYPE: DINE_IN vs TAKEAWAY
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');

  // Selected Table & Table Picker Modal
  const [selectedTable, setSelectedTable] = useState<AdminTable | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');

  // Takeaway Customer Info
  const [takeawayName, setTakeawayName] = useState('');
  const [takeawayPhone, setTakeawayPhone] = useState('');

  // Category Filter & Search
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
  const [qrPaymentStatus, setQrPaymentStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemsData, tablesData] = await Promise.all([
        fetchAdminMenuItemsApi(),
        fetchAdminTablesApi(),
      ]);
      setMenuItems(itemsData);
      setTables(tablesData);
      if (tablesData.length > 0) {
        setSelectedTable(tablesData[0]);
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

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  // Categories & Zones list
  const categories = ['all', ...Array.from(new Set(menuItems.map((i) => i.category)))];
  const zones = ['ALL', ...Array.from(new Set(tables.map((t) => t.zone)))];

  // Filtered menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  // Calculate totals
  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Send Order to Kitchen
  const handleSendToKitchen = () => {
    if (orderType === 'DINE_IN' && !selectedTable) {
      message.error('Vui lòng chọn bàn ăn trước khi gửi đơn!');
      return;
    }
    if (cart.length === 0) {
      message.error('Giỏ món ăn đang trống!');
      return;
    }
    const targetInfo = orderType === 'TAKEAWAY' ? `🛍️ ĐƠN MANG VỀ (${takeawayName || 'Khách lẻ'})` : `Bàn ${selectedTable?.tableNumber}`;
    message.success(`🔥 Đã gửi đơn ${cart.length} món của ${targetInfo} xuống Bếp KDS thành công!`);
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

  // Generate VietQR
  const handleGenerateVietQR = async () => {
    if (totalAmount === 0) return;
    try {
      setIsGeneratingQr(true);
      const tableLabel = orderType === 'TAKEAWAY' ? 'TAKEAWAY' : selectedTable?.tableNumber || '01';
      const response = await createVietQrPaymentApi(tableLabel, totalAmount);
      setCheckoutUrl(response.checkoutUrl);
      setQrCodeImageUrl(response.qrDataUrl);
      setQrPaymentStatus('PENDING');
      message.success('Đã tạo mã QR thanh toán VietQR thành công!');
    } catch (err) {
      message.error('Không thể khởi tạo mã QR thanh toán');
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
      if (orderType === 'DINE_IN' && selectedTable) {
        await updateTableStatusApi(selectedTable.id, 'EMPTY');
      }
      setCart([]);
      setIsCheckoutModalOpen(false);
      message.success('Đã hoàn tất thanh toán & giải phóng đơn!');
    } catch (err) {
      message.error('Lỗi khi thanh toán đơn hàng');
    }
  };

  // Simulate QR Result for Testing
  const handleSimulateQrResult = (status: 'SUCCESS' | 'FAILED') => {
    setQrPaymentStatus(status);
    if (status === 'SUCCESS') {
      message.success('Thanh toán chuyển khoản thành công!');
      setTimeout(() => {
        handleConfirmCompletePayment();
      }, 1500);
    } else {
      message.error('Thanh toán qua VietQR thất bại!');
    }
  };

  return (
    <div className="space-y-4 font-sans max-w-7xl mx-auto">
      {/* 1. POS TOPBAR TOOLBAR (BỔ SUNG NÚT CHỌN LOẠI ĐƠN ÂN TẠI BÀN VS MANG VỀ & NÚT CHỌN BÀN TRỰC QUAN) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-2xs flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-slate-900 tracking-tight">Đặt Món Nhanh Tại Bàn (Quick POS 1-Touch)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Hỗ trợ Phục vụ & Thu ngân gọi món nhanh tại bàn hoặc mang về</p>
          </div>
        </div>

        {/* CỤM LOẠI ĐƠN & BẢN ĐỒ CHỌN BÀN CHỐNG NHẦM LẪN KHI ĐÔNG KHÁCH */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* LOẠI ĐƠN SWITCHER: ĂN TẠI BÀN vs MANG VỀ */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                orderType === 'DINE_IN'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>🍽️ Ăn Tại Bàn</span>
            </button>

            <button
              onClick={() => setOrderType('TAKEAWAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                orderType === 'TAKEAWAY'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>🛍️ Mang Về (Takeaway)</span>
            </button>
          </div>

          {/* CHỌN BÀN ĂN (CHỈ HIỆN KHI ĂN TẠI BÀN) - NÚT BẤM MỞ SƠ ĐỒ CHỌN BÀN TRỰC QUAN */}
          {orderType === 'DINE_IN' ? (
            <button
              onClick={() => setIsTableModalOpen(true)}
              className="h-10 px-3.5 rounded-xl border border-orange-300 bg-orange-50/90 hover:bg-orange-100 text-orange-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition-all active:scale-98"
              title="Mở sơ đồ bàn để chọn chính xác tránh nhầm lẫn"
            >
              <MapPin className="w-4 h-4 text-orange-600" />
              <span>{selectedTable ? `Bàn ${selectedTable.tableNumber} (${selectedTable.zone})` : 'Chọn Bàn'}</span>
              <span className="px-2 py-0.5 rounded-md bg-white text-emerald-700 font-extrabold text-[10px] border border-slate-200">
                {selectedTable?.status === 'EMPTY' ? '🟢 Trống' : '🟠 Đang ăn'}
              </span>
              <ChevronDown className="w-4 h-4 text-orange-600" />
            </button>
          ) : (
            <div className="h-10 px-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold text-xs flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-600" />
              <span>🛍️ Đơn Mang Về (Takeaway)</span>
            </div>
          )}

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN: MENU DISHES GRID & CATEGORY TABS (7 COLS ON LARGE) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
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
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {cat === 'all' ? '🍽️ Tất cả món' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* PRODUCT CARDS TOUCH GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddToCart(item)}
                  className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between group active:scale-98 ${
                    !item.isAvailable ? 'opacity-50 grayscale' : ''
                  }`}
                >
                  <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                      {item.sku}
                    </span>
                    {!item.isAvailable && (
                      <span className="absolute inset-0 bg-black/50 text-white font-bold text-xs flex items-center justify-center">
                        Tạm hết hàng
                      </span>
                    )}
                  </div>

                  <div className="p-3 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </h4>
                    
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="font-black text-slate-900 text-xs sm:text-sm">
                        {formatVND(item.price)}
                      </span>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs font-bold text-xs"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: REALTIME ORDER CART & BILL OPERATIONS PANEL (5 COLS ON LARGE) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-4 sticky top-4">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Giỏ Đơn Tạm Tính</h3>
                  {orderType === 'DINE_IN' && selectedTable && (
                    <p className="text-[11px] text-orange-600 font-bold">
                      Bàn {selectedTable.tableNumber} • {selectedTable.zone}
                    </p>
                  )}
                  {orderType === 'TAKEAWAY' && (
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[10px]">
                      🛍️ ĐƠN MANG VỀ (TAKEAWAY)
                    </span>
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

            {/* Takeaway Info Input Fields (Only visible in Takeaway mode) */}
            {orderType === 'TAKEAWAY' && (
              <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-200 space-y-2">
                <p className="font-bold text-purple-950 text-xs flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-600" /> Thông tin khách nhận đơn mang về:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tên khách (VD: A. Hùng)"
                    value={takeawayName}
                    onChange={(e) => setTakeawayName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-purple-200 bg-white text-xs outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Số ĐT (VD: 0912...)"
                    value={takeawayPhone}
                    onChange={(e) => setTakeawayPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-purple-200 bg-white text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center space-y-2 border-2 border-dashed border-slate-100 rounded-xl">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Chạm chọn món ăn bên trái để thêm vào đơn</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-xs">{item.product.name}</p>
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
                        <span className="font-black text-xs text-slate-900 px-1">{item.quantity}</span>
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

                    <div className="text-right pt-1 border-t border-slate-200/60 font-black text-slate-900 text-xs">
                      {formatVND(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Amount Summary */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                <span>Số lượng món:</span>
                <span className="font-bold text-slate-900">{cart.reduce((s, i) => s + i.quantity, 0)} món</span>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 flex justify-between items-center">
                <span className="font-bold text-orange-950 text-xs">TỔNG CẦN THANH TOÁN:</span>
                <span className="font-black text-lg text-orange-600">{formatVND(totalAmount)}</span>
              </div>
            </div>

            {/* 3 BOTTOM TOUCH OPERATION BUTTONS (MINIMUM 48PX ERGONOMIC TOUCH) */}
            <div className="space-y-2 pt-2">
              {/* Button 1: Gửi Đơn Bếp KDS */}
              <button
                onClick={handleSendToKitchen}
                disabled={cart.length === 0}
                className={`w-full h-12 rounded-xl font-bold text-white text-xs flex items-center justify-center gap-2 shadow-sm transition-all min-h-[48px] cursor-pointer ${
                  cart.length > 0 ? 'bg-orange-600 hover:bg-orange-700 active:scale-98' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <ChefHat className="w-5 h-5" />
                <span>🔥 Gửi Đơn Bếp KDS</span>
              </button>

              {/* Button 2: Thanh Toán Ngay */}
              <button
                onClick={handleOpenCheckoutModal}
                disabled={cart.length === 0}
                className={`w-full h-12 rounded-xl font-bold text-white text-xs flex items-center justify-center gap-2 shadow-sm transition-all min-h-[48px] cursor-pointer ${
                  cart.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>💳 Thanh Toán Hóa Đơn</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 1. MODAL SƠ ĐỒ CHỌN BÀN ĂN TRỰC QUAN (CHỐNG NHẦM LẪN KHI ĐÔNG KHÁCH) */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            <span>🗺️ Sơ Đồ Chọn Bàn Phục Vụ (Tránh Nhầm Bàn Khi Đông Khách)</span>
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
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    selectedZoneFilter === zone
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
                    message.success(`Đã chọn Bàn ${tbl.tableNumber} (${tbl.zone})`);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-2xs space-y-2 select-none ${
                    isCurrentSelected
                      ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-200'
                      : isEmpty
                      ? 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-400'
                      : 'border-slate-200 bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-slate-900">Bàn {tbl.tableNumber}</span>
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

      {/* 2. INTEGRATED CHECKOUT PAYMENT MODAL FOR QUICK POS */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>
              💳 Thanh Toán Hóa Đơn POS -{' '}
              {orderType === 'TAKEAWAY' ? '🛍️ ĐƠN MANG VỀ' : `Bàn ${selectedTable?.tableNumber}`}
            </span>
          </div>
        }
        open={isCheckoutModalOpen}
        onCancel={() => setIsCheckoutModalOpen(false)}
        width={620}
        footer={null}
      >
        {selectedTable && (
          <div className="space-y-4 pt-2 text-xs font-sans">
            {/* Ordered Items Summary */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                <span className="font-bold text-slate-900 text-xs">Chi tiết đơn POS:</span>
                <span className="font-bold text-orange-600">
                  {orderType === 'TAKEAWAY' ? `🛍️ MANG VỀ (${takeawayName || 'Khách lẻ'})` : `Bàn ${selectedTable.tableNumber}`}
                </span>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">
                      {item.product.name} <span className="text-orange-600 font-bold">x{item.quantity}</span>
                    </span>
                    <span className="font-bold text-slate-900">{formatVND(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900">TỔNG TIỀN HÓA ĐƠN:</span>
                <span className="font-black text-base text-emerald-600">{formatVND(totalAmount)}</span>
              </div>
            </div>

            {/* Payment Tabs */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('CASH')}
                  className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethodTab === 'CASH'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>1. Tiền Mặt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('QR')}
                  className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethodTab === 'QR'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-orange-600" />
                  <span>2. Mã QR VietQR</span>
                </button>
              </div>

              {/* View 1: Cash Payment */}
              {paymentMethodTab === 'CASH' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số tiền nhận của khách (VND) *</label>
                    <input
                      type="number"
                      placeholder="VD: 500000"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value ? Number(e.target.value) : '')}
                      className="w-full p-3 rounded-xl border border-slate-300 font-extrabold text-slate-900 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {cashReceived !== '' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
                      <span className="font-bold text-emerald-950">TIỀN THỪA TRẢ LẠI:</span>
                      <span className="font-black text-base text-emerald-700">
                        {Number(cashReceived) >= totalAmount
                          ? formatVND(Number(cashReceived) - totalAmount)
                          : 'Khách đưa thiếu tiền'}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmCompletePayment}
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer min-h-[48px]"
                  >
                    Xác Nhận Đã Nhận Tiền Mặt & Clear Bàn
                  </button>
                </div>
              )}

              {/* View 2: QR Payment */}
              {paymentMethodTab === 'QR' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 text-center">
                  {!checkoutUrl ? (
                    <div className="py-6 space-y-3">
                      <QrCode className="w-10 h-10 text-orange-600 mx-auto" />
                      <h4 className="font-bold text-slate-900 text-xs">Thanh Toán Mã QR VietQR / PayOS</h4>
                      <button
                        type="button"
                        onClick={handleGenerateVietQR}
                        className="h-10 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Tạo Mã QR Thanh Toán</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qrPaymentStatus === 'PENDING' && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 inline-block w-full max-w-sm">
                          <img src={qrCodeImageUrl} alt="Mã QR PayOS" className="w-44 h-44 mx-auto border border-slate-200 p-2 bg-white rounded-xl" />
                          <p className="text-[11px] text-slate-600 font-bold">Số tiền: {formatVND(totalAmount)}</p>

                          <div className="flex justify-center gap-2 pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleSimulateQrResult('SUCCESS')}
                              className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold"
                            >
                              [Giả Lập Thành Công]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSimulateQrResult('FAILED')}
                              className="px-2 py-1 rounded bg-red-100 text-red-800 text-[10px] font-bold"
                            >
                              [Giả Lập Thất Bại]
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleCancelQrPayment}
                            className="w-full h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5 text-slate-500" />
                            <span>Hủy Giao Dịch QR</span>
                          </button>
                        </div>
                      )}

                      {qrPaymentStatus === 'SUCCESS' && (
                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 text-center space-y-2">
                          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                          <h3 className="font-bold text-base text-emerald-900">Thanh toán thành công</h3>
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
