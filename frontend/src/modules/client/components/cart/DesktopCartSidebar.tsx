import React from 'react';
import type { CartItem } from '../../types';
import { ShoppingBag, Plus, Minus, ArrowRight, Trash2 } from 'lucide-react';

interface DesktopCartSidebarProps {
  items: CartItem[];
  totalAmount: number;
  onUpdateQuantity: (productId: number, delta: number) => void;
  onClearCart: () => void;
  onSubmitOrder: () => void;
  isSubmitting?: boolean;
}

export const DesktopCartSidebar: React.FC<DesktopCartSidebarProps> = ({
  items,
  totalAmount,
  onUpdateQuantity,
  onClearCart,
  onSubmitOrder,
  isSubmitting = false,
}) => {
  return (
    <aside className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 flex flex-col h-[calc(100vh-140px)] sticky top-28">
      {/* Sidebar Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-base text-gray-900">Giỏ hàng của bạn</h3>
            <p className="text-xs text-gray-400 font-label">{items.length} loại món chọn</p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs font-bold text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            title="Xóa tất cả món"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cart Items Scroll Container */}
      <div className="flex-1 overflow-y-scroll space-y-3 pr-1 custom-scrollbar">
        {items.length === 0 ? (
          <div className="py-20 text-center text-gray-400 space-y-3">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-headline font-semibold text-gray-600">Chưa có món nào</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">Chọn các món ăn ngon từ thực đơn bên trái để gọi món.</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className="bg-gray-50/70 rounded-2xl p-3.5 border border-gray-100 flex items-center gap-3 transition-all hover:bg-white hover:shadow-sm hover:border-gray-200"
            >
              <img
                src={
                  item.productImageUrl ||
                  "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80"
                }
                alt={item.productName}
                className="w-14 h-14 rounded-xl object-cover bg-gray-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-headline font-bold text-gray-900 text-sm leading-snug break-words">
                  {item.productName}
                </h4>
                <p className="font-headline font-extrabold text-orange-600 text-xs mt-0.5">
                  {new Intl.NumberFormat('vi-VN').format(item.productPrice * item.quantity)}₫
                </p>
                {item.note && (
                  <p className="text-[11px] text-gray-400 italic truncate mt-0.5">"{item.note}"</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-gray-200/80 shadow-sm">
                <button
                  onClick={() => onUpdateQuantity(item.productId, -1)}
                  className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 active:scale-90 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-headline font-bold text-xs px-1 text-gray-900">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.productId, 1)}
                  className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 active:scale-90 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sidebar Checkout Footer */}
      {items.length > 0 && (
        <div className="pt-4 border-t border-gray-100 mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 font-label">Tổng thanh toán:</span>
            <span className="font-headline font-black text-2xl text-orange-600">
              {new Intl.NumberFormat('vi-VN').format(totalAmount)}₫
            </span>
          </div>

          <button
            onClick={onSubmitOrder}
            disabled={isSubmitting}
            className={`w-full font-headline font-bold py-3.5 rounded-2xl shadow-lg flex justify-center items-center gap-2 transition-all cursor-pointer ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white shadow-orange-500/25'
            }`}
          >
            <span>{isSubmitting ? 'Đang đặt món...' : 'Đặt món'}</span>
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </aside>
  );
};
