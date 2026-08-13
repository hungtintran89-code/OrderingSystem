import React, { useState } from 'react';
import type { Product } from '../../types';
import { X, Plus, Minus, Check } from 'lucide-react';

interface ProductNoteModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product, quantity: number, note: string) => void;
}

export const ProductNoteModal: React.FC<ProductNoteModalProps> = ({
  product,
  onClose,
  onConfirm,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onConfirm(product, quantity, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header Image */}
        <div className="relative h-48 bg-gray-100 flex-shrink-0">
          <img
            src={
              product.productImageUrl ||
              "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80"
            }
            alt={product.productName}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full backdrop-blur-md shadow-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <h2 className="font-headline font-bold text-xl text-gray-900">{product.productName}</h2>
            <p className="font-headline font-black text-orange-600 text-xl mt-1">
              {new Intl.NumberFormat('vi-VN').format(product.productPrice)}₫
            </p>
          </div>

          {/* Quantity Stepper */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-label">
              Số lượng
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="font-headline font-black text-2xl text-gray-900 w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-11 h-11 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Custom Note Input */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-label">
              Ghi chú chi tiết
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú yêu cầu của bạn..."
              rows={2}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all font-body"
            />
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-400 font-label">Tổng cộng</p>
            <p className="font-headline font-black text-xl text-orange-600">
              {new Intl.NumberFormat('vi-VN').format(product.productPrice * quantity)}₫
            </p>
          </div>
          <button
            onClick={handleSubmit}
            className="flex-1 max-w-xs bg-orange-600 hover:bg-orange-700 text-white font-headline font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>Thêm vào giỏ hàng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
