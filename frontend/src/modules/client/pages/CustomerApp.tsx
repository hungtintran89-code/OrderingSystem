import { useState, useEffect } from 'react';
import type { CategoryMenu, Product, CartItem, PersonalOrder, MasterTableOrder, TableInfo, RequestType } from '../types';
import { apiService } from '../services/api';
import { MOCK_TABLES, MOCK_PERSONAL_ORDERS, MOCK_MASTER_TABLE_ORDER } from '../services/mockData';

// Customer Components
import { Header } from '../components/common/Header';
import { CategoryTabs } from '../components/common/CategoryTabs';
import { ProductCard } from '../components/menu/ProductCard';
import { ProductNoteModal } from '../components/menu/ProductNoteModal';
import { CartDrawer } from '../components/cart/CartDrawer';
import { DesktopCartSidebar } from '../components/cart/DesktopCartSidebar';
import { OrderHistoryModal } from '../components/orders/OrderHistoryModal';
import { ServiceRequestModal } from '../components/service/ServiceRequestModal';

import { wsService } from '../services/websocket';
import { Search, Bell, ShoppingBag, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { filterAndSortByRelevance } from '../../../utils/vietnameseSearch';

// Hàm lấy hoặc khởi tạo định danh duy nhất cho từng điện thoại/thiết bị cá nhân (threadId)
const getOrCreateDeviceThreadId = (): number => {
  const STORAGE_KEY = 'ordering_system_device_thread_id';
  try {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saved = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem(STORAGE_KEY, saved);
    }
    return Number(saved);
  } catch {
    return Math.floor(100000 + Math.random() * 900000);
  }
};

export function CustomerApp() {
  const [currentTable, setCurrentTable] = useState<TableInfo>(MOCK_TABLES[0]);
  const [threadId] = useState<number>(getOrCreateDeviceThreadId);
  const [categories, setCategories] = useState<CategoryMenu[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tra cứu bàn thực tế từ DB dựa trên URL query param tableToken/path/localStorage (hoặc mặc định 'default')
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let tokenToFetch = params.get('tableToken') || params.get('token') || params.get('qrToken');

    if (!tokenToFetch) {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart !== 'client' && lastPart !== 'menu') {
        tokenToFetch = lastPart;
      }
    }

    if (!tokenToFetch) {
      try {
        const savedJson = localStorage.getItem('ordering_system_active_client_table');
        if (savedJson) {
          const savedTable = JSON.parse(savedJson);
          if (savedTable && savedTable.qrToken) {
            tokenToFetch = savedTable.qrToken;
          }
        }
      } catch {}
    }

    if (!tokenToFetch) {
      tokenToFetch = 'default';
    }

    apiService.getTableInfo(tokenToFetch).then((info) => {
      if (info && info.tableId) {
        const resolvedTable: TableInfo = {
          tableId: Number(info.tableId),
          tableName: info.tableName,
          tableSessionId: info.sessionId || Number(info.tableId),
          qrToken: tokenToFetch !== 'default' ? tokenToFetch : '',
        };
        setCurrentTable(resolvedTable);
        try {
          localStorage.setItem('ordering_system_active_client_table', JSON.stringify(resolvedTable));
        } catch {}
      }
    }).catch((err) => {
      console.error('Error loading table info:', err);
    });
  }, []);

  // Khởi tạo giỏ hàng trống cho khách chọn món thực tế từ DB
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isServiceOpen, setIsServiceOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  const [personalOrders, setPersonalOrders] = useState<PersonalOrder | null>(MOCK_PERSONAL_ORDERS);
  const [, setMasterTableOrder] = useState<MasterTableOrder | null>(MOCK_MASTER_TABLE_ORDER);

  useEffect(() => {
    loadMenu();
    loadOrders();
    wsService.connect(
      currentTable.tableSessionId,
      threadId,
      () => loadOrders(),
      () => loadOrders()
    );

    return () => {
      wsService.disconnect();
    };
  }, [currentTable, threadId]);

  const loadMenu = async () => {
    const data = await apiService.getMenu(currentTable.qrToken);
    setCategories(data);
  };

  const loadOrders = async () => {
    const pOrder = await apiService.getPersonalOrder(currentTable.tableSessionId, threadId);
    const mOrder = await apiService.getMasterTableOrder(currentTable.tableId);
    setPersonalOrders(pOrder);
    setMasterTableOrder(mOrder);
  };

  const handleAddToCart = (product: Product, quantity = 1, note = '') => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.productId && item.note === note);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        updated[existingIdx].priceTotal = updated[existingIdx].quantity * updated[existingIdx].productPrice;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.productId,
            productName: product.productName,
            productPrice: product.productPrice,
            quantity,
            priceTotal: product.productPrice * quantity,
            note,
            productImageUrl: product.productImageUrl
          }
        ];
      }
    });

    apiService.addToCart(currentTable.tableSessionId, threadId, product.productId, quantity, note);
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, priceTotal: newQty * item.productPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    apiService.clearCart(currentTable.tableSessionId, threadId);
  };

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;

    const itemsToSubmit = cartItems.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
      note: item.note
    }));

    const result = await apiService.submitOrder(currentTable.tableId, threadId, itemsToSubmit);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newOrderItems = cartItems.map((item, i) => ({
      orderItemId: Date.now() + i,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      priceProduct: item.productPrice,
      priceTotal: item.quantity * item.productPrice,
      note: item.note,
      threadId,
      status: 'COOKING' as const,
      orderedAt: nowStr
    }));

    setPersonalOrders((prev) => ({
      tableSessionId: currentTable.tableSessionId,
      threadId,
      myTotal: (prev?.myTotal || 0) + cartTotal,
      myItems: [...newOrderItems, ...(prev?.myItems || [])]
    }));

    setMasterTableOrder((prev) => ({
      tableId: currentTable.tableId,
      tableName: currentTable.tableName,
      tableSessionId: currentTable.tableSessionId,
      sessionStatus: 'ACTIVE',
      totalPrice: (prev?.totalPrice || 0) + cartTotal,
      allTableItems: [...newOrderItems, ...(prev?.allTableItems || [])]
    }));

    setCartItems([]);
    setIsCartOpen(false);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
    await loadOrders();
  };

  const handleServiceRequest = (type: RequestType) => {
    apiService.sendServiceRequest(`TOKEN_${currentTable.tableSessionId}`, type);
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.productPrice * item.quantity, 0);
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const rawProducts: (Product & { name: string; category: string })[] = [];
  categories.forEach((cat) => {
    if (activeCategoryId !== null && cat.categoryId !== activeCategoryId) return;
    cat.products.forEach((p) => {
      rawProducts.push({
        ...p,
        name: p.productName,
        category: cat.categoryName,
      });
    });
  });

  const allFilteredProducts = filterAndSortByRelevance(rawProducts, searchQuery, 'Tất cả');

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col font-body text-gray-900 pb-24">
      {/* Toast Notification on Order Success */}
      {showSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-down border border-emerald-500 w-[90%] max-w-md">
          <CheckCircle2 className="w-6 h-6 text-emerald-200 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-sm leading-tight">Đặt món thành công!</p>
            <p className="text-xs text-emerald-100 font-label mt-0.5 truncate">
              Đã gửi đơn hàng đến nhà bếp chế biến.
            </p>
          </div>
          <button
            onClick={() => {
              setShowSuccessToast(false);
              setIsHistoryOpen(true);
            }}
            className="text-xs font-bold bg-white text-emerald-800 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            Xem lịch sử
          </button>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-emerald-200 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Sticky Header across 100% width */}
      <Header
        currentTable={currentTable}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Layout Container */}
      <main className="max-w-7xl mx-auto pt-20 sm:pt-22 px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* Main Food Menu Section */}
          <div className="lg:col-span-8">
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm món ăn (Phở bò, Cơm tấm, Trà đá...)"
                className="w-full pl-11 pr-4 py-3 bg-white text-sm border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
              />
            </div>

            {/* Category Tabs */}
            <CategoryTabs
              categories={categories}
              activeCategoryId={activeCategoryId}
              onSelectCategory={(id) => setActiveCategoryId(id)}
            />

            {/* Food Grid Without Category Section Headers */}
            <div className="mt-4">
              {allFilteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100 my-8">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="font-headline font-bold text-gray-700 text-lg">Không tìm thấy món phù hợp</p>
                  <p className="text-xs text-gray-400 mt-1">Thử từ khóa tìm kiếm khác hoặc chọn "Tất cả món".</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                  {allFilteredProducts.map((product) => {
                    const cartItem = cartItems.find((ci) => ci.productId === product.productId);
                    const qty = cartItem ? cartItem.quantity : 0;

                    return (
                      <ProductCard
                        key={product.productId}
                        product={product}
                        quantityInCart={qty}
                        onAddToCart={() => setSelectedProduct(product)}
                        onUpdateQuantity={(p, delta) => handleUpdateQuantity(p.productId, delta)}
                        onOpenDetails={(p) => setSelectedProduct(p)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Persistent Cart Sidebar */}
          <div className="hidden lg:block lg:col-span-4">
            <DesktopCartSidebar
              items={cartItems}
              totalAmount={cartTotal}
              onUpdateQuantity={(pid, delta) => handleUpdateQuantity(pid, delta)}
              onClearCart={handleClearCart}
              onSubmitOrder={handleSubmitOrder}
            />
          </div>
        </div>
      </main>

      {/* Floating Action Button (Only Service Request Button) */}
      <div className="fixed bottom-24 right-4 sm:right-6 flex flex-col gap-3 z-30">
        <button
          onClick={() => setIsServiceOpen(true)}
          className="w-13 h-13 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-orange-600 active:scale-95 transition-all hover:bg-orange-50 hover:scale-105 cursor-pointer"
          title="Gọi phục vụ tại bàn"
        >
          <Bell className="w-5 h-5 text-orange-600" />
        </button>
      </div>

      {/* Mobile / Tablet Floating Order Bar */}
      {totalCartCount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-0 right-0 max-w-xl mx-auto px-4 z-40 animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl p-4 shadow-xl shadow-orange-500/30 flex justify-between items-center transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center relative">
                <ShoppingBag className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {totalCartCount}
                </span>
              </div>
              <div className="text-left">
                <p className="font-headline font-bold text-sm leading-tight">Xem giỏ hàng</p>
                <p className="text-xs text-orange-100">{cartItems.length} loại món chọn</p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-headline font-black text-lg">
              <span>{new Intl.NumberFormat('vi-VN').format(cartTotal)}₫</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <ProductNoteModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onConfirm={(p, qty, note) => handleAddToCart(p, qty, note)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        totalAmount={cartTotal}
        onUpdateQuantity={(pid, delta) => handleUpdateQuantity(pid, delta)}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
      />

      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        personalOrders={personalOrders}
        currentTable={currentTable}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <ServiceRequestModal
        isOpen={isServiceOpen}
        onClose={() => setIsServiceOpen(false)}
        onRequest={handleServiceRequest}
        tableName={currentTable.tableName}
      />
    </div>
  );
}

export default CustomerApp;
