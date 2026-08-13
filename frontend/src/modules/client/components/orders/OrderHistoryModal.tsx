import React from 'react';
import type { PersonalOrder, TableInfo } from '../../types';
import { ArrowLeft, ShoppingBag, Clock } from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalOrders: PersonalOrder | null;
  currentTable: TableInfo;
  onOpenCart: () => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  personalOrders,
  currentTable,
  onOpenCart,
}) => {
  if (!isOpen) return null;

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const personalItems = personalOrders?.myItems || [];
  const personalTotal = personalOrders?.myTotal || 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#fafaf9] overflow-y-auto pt-16 animate-fadeIn">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-white shadow-sm border-b border-gray-100 transition-colors duration-300">
        <button
          onClick={onClose}
          className="text-gray-600 hover:bg-gray-100 transition-colors active:scale-95 rounded-full p-2 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="font-headline text-lg font-bold text-orange-600 tracking-tight">
          Lịch sử món đã đặt
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenCart();
            }}
            className="text-gray-600 hover:bg-gray-100 transition-colors active:scale-95 rounded-full p-2 flex items-center justify-center cursor-pointer"
          >
            <ShoppingBag className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 py-4">
        {/* Summary Header */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="font-headline font-bold text-xl text-gray-800">{currentTable.tableName}</h2>
            <p className="text-xs text-gray-500 font-label mt-0.5">
              Tổng số {personalItems.length} món bạn đã gọi
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-label">Tổng cộng</p>
            <p className="font-headline font-black text-2xl text-orange-600">{formatVND(personalTotal)}</p>
          </div>
        </div>

        {/* Personal Order List Only */}
        <div className="flex flex-col gap-3">
          {personalItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-headline font-semibold text-gray-600">Bạn chưa đặt món nào</p>
              <p className="text-xs text-gray-400 mt-1">Các món bạn gửi nhà bếp sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            personalItems.map((item) => {
              return (
                <div
                  key={item.orderItemId}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center transition-all duration-200 hover:shadow-md"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={
                        item.productId === 101
                          ? "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80"
                          : item.productId === 102
                          ? "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80"
                          : item.productId === 201
                          ? "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80"
                          : "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={item.productName}
                      className="w-full h-full object-cover shadow-sm"
                    />
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md border border-gray-100">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-800">
                        x{item.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-headline font-bold text-gray-900 text-base truncate">
                        {item.productName}
                      </h3>
                      <span className="font-semibold text-gray-900 whitespace-nowrap text-sm">
                        {formatVND(item.priceTotal || item.priceProduct * item.quantity)}
                      </span>
                    </div>

                    {item.note && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">
                        "{item.note}"
                      </p>
                    )}

                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-label flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.orderedAt || "19:15"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};
