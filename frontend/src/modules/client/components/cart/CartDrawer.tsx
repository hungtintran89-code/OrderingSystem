import React from 'react';
import type { CartItem } from '../../types';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalAmount: number;
  onUpdateQuantity: (productId: number, delta: number) => void;
  onClearCart: () => void;
  onSubmitOrder: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  totalAmount,
  onUpdateQuantity,
  onClearCart,
  onSubmitOrder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-gray-900">Giỏ hàng của bạn</h2>
              <p className="text-xs text-gray-400 font-label">{items.length} món được chọn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-3">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="font-headline font-semibold text-gray-600">Giỏ hàng trống</p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">Hãy chọn các món ăn ngon từ thực đơn để thêm vào giỏ hàng.</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item.productId}-${idx}`}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:border-gray-200"
              >
                <img
                  src={
                    item.productImageUrl ||
                    "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={item.productName}
                  className="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline font-bold text-gray-900 text-sm truncate">
                    {item.productName}
                  </h4>
                  <p className="font-headline font-extrabold text-orange-600 text-sm mt-0.5">
                    {new Intl.NumberFormat('vi-VN').format(item.productPrice * item.quantity)}₫
                  </p>
                  {item.note && (
                    <p className="text-xs text-gray-400 italic truncate mt-0.5">"{item.note}"</p>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200/60">
                  <button
                    onClick={() => onUpdateQuantity(item.productId, -1)}
                    className="w-7 h-7 rounded-lg bg-white text-gray-700 flex items-center justify-center shadow-sm active:scale-90 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-headline font-bold text-xs px-1 text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, 1)}
                    className="w-7 h-7 rounded-lg bg-white text-gray-700 border border-gray-200/80 flex items-center justify-center shadow-sm active:scale-90 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <button
                onClick={onClearCart}
                className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
              </button>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-label">Tổng cộng: </span>
                <span className="font-headline font-black text-xl text-orange-600">
                  {new Intl.NumberFormat('vi-VN').format(totalAmount)}₫
                </span>
              </div>
            </div>

            <button
              onClick={onSubmitOrder}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-headline font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Gửi đơn cho nhà bếp</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
