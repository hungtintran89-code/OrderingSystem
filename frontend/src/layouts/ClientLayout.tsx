import React, { useState } from 'react';
import { Input, Badge, Button, Drawer, Tag, Modal, Radio, message } from 'antd';
import { Outlet } from 'react-router-dom';
import {
  UtensilsCrossed,
  Search,
  History,
  ShoppingBag,
  Bell,
  CreditCard,
  Clock,
  CheckCircle2,
  ChefHat,
  Receipt,
  QrCode,
  Banknote
} from 'lucide-react';

interface ClientLayoutProps {
  children?: React.ReactNode;
  tableName?: string;
  cartItemCount?: number;
}

interface OrderedHistoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: 'PREPARING' | 'SERVED';
  orderTime: string;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({
  children,
  tableName = 'Bàn 08 - Tầng 1',
  cartItemCount = 2,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCallStaffModalOpen, setIsCallStaffModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cash'>('qr');

  const categories = [
    { id: 'all', name: 'Tất cả món' },
    { id: 'bestseller', name: 'Nổi bật' },
    { id: 'main', name: 'Món chính' },
    { id: 'appetizer', name: 'Khai vị' },
    { id: 'drink', name: 'Đồ uống' },
    { id: 'dessert', name: 'Tráng miệng' },
  ];

  // Dummy data for Ordered History (Món đã đặt tại bàn)
  const orderedHistory: OrderedHistoryItem[] = [
    {
      id: 'ord-101',
      name: 'Phở Bò Đặc Biệt (Bát Lớn)',
      quantity: 2,
      price: 85000,
      status: 'SERVED',
      orderTime: '12:15',
    },
    {
      id: 'ord-102',
      name: 'Gỏi Cuốn Tôm Thịt (3 Cuốn)',
      quantity: 1,
      price: 45000,
      status: 'PREPARING',
      orderTime: '12:22',
    },
  ];

  const subtotal = orderedHistory.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const vat = subtotal * 0.08;
  const grandTotal = subtotal + vat;

  const handleCallStaff = () => {
    message.success({
      content: 'Đã gửi yêu cầu gọi nhân viên! Phục vụ sẽ tới bàn ngay.',
      icon: <Bell className="w-4 h-4 text-amber-500 mr-2" />,
    });
    setIsCallStaffModalOpen(false);
  };

  const handleRequestPayment = () => {
    message.success({
      content: 'Đã gửi yêu cầu tính tiền tới thu ngân!',
      icon: <CreditCard className="w-4 h-4 text-emerald-500 mr-2" />,
    });
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pb-28">
      {/* 1. FIXED TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Brand Logo + Table Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-sm">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-semibold text-sm md:text-base text-slate-900 leading-tight">
                  Phở Ngon 1989
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {tableName}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Compact Search Bar */}
            <div className="hidden sm:block flex-1 max-w-xs mx-3">
              <Input
                placeholder="Tìm món ăn..."
                prefix={<Search className="w-4 h-4 text-slate-400 mr-1" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border-slate-200 bg-slate-50 text-xs py-1.5 focus:border-orange-500"
                allowClear
              />
            </div>

            {/* Right: Action Buttons Group */}
            <div className="flex items-center gap-2">
              {/* Nút Lịch Sử Đặt Món */}
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Lịch sử món đã đặt"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span className="hidden md:inline">Đã đặt</span>
                <span className="bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                  {orderedHistory.length}
                </span>
              </button>

              {/* Nút Giỏ Hàng */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="h-9 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer relative"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Giỏ hàng</span>
                {cartItemCount > 0 && (
                  <span className="bg-white text-orange-600 font-bold text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-2.5 sm:hidden">
            <Input
              placeholder="Tìm tên món ăn..."
              prefix={<Search className="w-4 h-4 text-slate-400 mr-1" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border-slate-200 bg-slate-50 text-xs py-1.5"
              allowClear
            />
          </div>
        </div>
      </header>

      {/* 2. SUB-HEADER: CATEGORY CHIPS SCROLL */}
      <nav className="sticky top-[57px] sm:top-[61px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 py-2.5 px-4 overflow-x-auto no-scrollbar">
        <div className="max-w-5xl mx-auto flex items-center gap-2 min-w-max">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto w-full px-4 pt-4 flex-1">
        {children || <Outlet />}
      </main>

      {/* 4. STICKY BOTTOM FLOATING BAR: 2 NÚT SONG SONG (Gọi Phục Vụ & Yêu Cầu Tính Tiền) */}
      <div className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-md bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200/80 grid grid-cols-2 gap-2.5">
          {/* Nút 1: Gọi Phục Vụ (Amber Soft Fill / Outline) */}
          <button
            onClick={() => setIsCallStaffModalOpen(true)}
            className="h-12 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>Gọi phục vụ</span>
          </button>

          {/* Nút 2: Yêu Cầu Tính Tiền (Emerald Green Solid Fill) */}
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="h-12 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <CreditCard className="w-4 h-4" />
            <span>Yêu cầu tính tiền</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: XÁC NHẬN GỌI PHỤC VỤ */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <Bell className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-base">Yêu cầu phục vụ tại bàn</span>
          </div>
        }
        open={isCallStaffModalOpen}
        onCancel={() => setIsCallStaffModalOpen(false)}
        footer={null}
        centered
        width={400}
        className="rounded-xl overflow-hidden"
      >
        <div className="py-3 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn có cần hỗ trợ lấy thêm gia vị, đũa chén hoặc dọn bàn tại <strong>{tableName}</strong>?
          </p>

          <div className="flex gap-2">
            <Button
              className="flex-1 h-10 rounded-lg text-xs font-medium border-slate-200"
              onClick={() => setIsCallStaffModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              className="flex-1 h-10 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 border-none shadow-sm"
              onClick={handleCallStaff}
            >
              Gửi yêu cầu ngay
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: XÁC NHẬN YÊU CẦU TÍNH TIỀN */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-base">Hóa đơn tạm tính {tableName}</span>
          </div>
        }
        open={isPaymentModalOpen}
        onCancel={() => setIsPaymentModalOpen(false)}
        footer={null}
        centered
        width={440}
        className="rounded-xl overflow-hidden"
      >
        <div className="py-2 space-y-4">
          {/* Bill Items Summary */}
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
            {orderedHistory.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-800">{item.name}</span>
                  <span className="text-slate-400 ml-2">x{item.quantity}</span>
                </div>
                <span className="font-medium text-slate-900">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính món ăn:</span>
              <span>{subtotal.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thuế VAT (8%):</span>
              <span>{vat.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-200 mt-1">
              <span>Tổng thanh toán:</span>
              <span className="text-emerald-600 text-base font-extrabold">
                {grandTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Phương thức thanh toán mong muốn
            </label>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full grid grid-cols-2 gap-2"
            >
              <label
                className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'qr'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-emerald-200'
                }`}
              >
                <Radio value="qr" className="sr-only" />
                <QrCode className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-xs text-slate-900">Chuyển khoản QR</p>
                  <p className="text-[10px] text-slate-500">Quét mã VietQR</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-emerald-200'
                }`}
              >
                <Radio value="cash" className="sr-only" />
                <Banknote className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-xs text-slate-900">Tiền mặt</p>
                  <p className="text-[10px] text-slate-500">Thanh toán trực tiếp</p>
                </div>
              </label>
            </Radio.Group>
          </div>

          <div className="flex gap-2.5 pt-1">
            <Button
              className="flex-1 h-10 rounded-lg text-xs font-medium border-slate-200"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Xem lại
            </Button>
            <Button
              type="primary"
              className="flex-1 h-10 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm"
              onClick={handleRequestPayment}
            >
              Gửi yêu cầu thanh toán
            </Button>
          </div>
        </div>
      </Modal>

      {/* DRAWER 1: LỊCH SỬ ĐẶT MÓN */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <span className="font-semibold text-sm">Món đã đặt tại {tableName}</span>
          </div>
        }
        placement="right"
        onClose={() => setIsHistoryOpen(false)}
        open={isHistoryOpen}
        width={380}
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
            Danh sách các món ăn đã được xác nhận gửi bếp cho bàn này.
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            {orderedHistory.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-start text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">x{item.quantity}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{item.orderTime}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-medium text-slate-900 block">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                  {item.status === 'SERVED' ? (
                    <Tag icon={<CheckCircle2 className="w-3 h-3" />} color="success" className="text-[10px] font-medium mr-0">
                      Đã ra món
                    </Tag>
                  ) : (
                    <Tag icon={<Clock className="w-3 h-3 animate-spin" />} color="processing" className="text-[10px] font-medium mr-0">
                      Đang chế biến
                    </Tag>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-between text-sm font-semibold">
            <span>Tổng tiền món đã gọi:</span>
            <span className="text-orange-600 font-bold">
              {subtotal.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>
      </Drawer>

      {/* DRAWER 2: GIỎ HÀNG */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-sm">Giỏ hàng đang chọn</span>
          </div>
        }
        placement="right"
        onClose={() => setIsCartOpen(false)}
        open={isCartOpen}
        width={380}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Vui lòng kiểm tra lại các món trước khi gửi đơn bếp.</p>
          <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200/80 text-center">
            <ChefHat className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">Giỏ hàng có {cartItemCount} món</p>
            <p className="text-xs text-slate-500 mt-0.5">Sẵn sàng để gửi nhà bếp chế biến</p>
          </div>

          <Button
            type="primary"
            block
            size="large"
            className="h-11 rounded-lg bg-orange-600 hover:bg-orange-700 border-none font-semibold text-xs shadow-sm"
            onClick={() => {
              message.success('Đã gửi đơn hàng thành công tới nhà bếp!');
              setIsCartOpen(false);
            }}
          >
            Gửi đơn đặt món
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default ClientLayout;
