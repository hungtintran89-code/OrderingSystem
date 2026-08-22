import React from 'react';
import type { Product } from '../../types';
import { Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (product: Product, delta: number) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetails,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/80 flex flex-col transition-all duration-300 hover:shadow-md hover:border-gray-200 group">
      {/* Product Image */}
      <div
        onClick={() => onOpenDetails(product)}
        className="relative aspect-square w-full bg-gray-100 overflow-hidden cursor-pointer"
      >
        <img
          src={
            product.productImageUrl ||
            "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80"
          }
          alt={product.productName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {quantityInCart > 0 && (
          <div className="absolute top-2 right-2 bg-orange-600 text-white font-headline font-black text-xs px-2.5 py-1 rounded-full shadow-md">
            x{quantityInCart}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2">
        <div onClick={() => onOpenDetails(product)} className="cursor-pointer">
          <h3 className="font-headline font-bold text-gray-900 text-sm sm:text-base leading-snug break-words group-hover:text-orange-600 transition-colors">
            {product.productName}
          </h3>
          <p className="font-headline font-extrabold text-orange-600 text-base sm:text-lg mt-0.5">
            {formatPrice(product.productPrice)}
          </p>
        </div>

        {/* Action Button / Stepper */}
        <div className="pt-1">
          {quantityInCart === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="w-full bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white font-headline font-bold text-xs sm:text-sm py-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 border border-orange-200/60 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm</span>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-orange-50 rounded-2xl p-1 border border-orange-200/60">
              <button
                onClick={() => onUpdateQuantity(product, -1)}
                className="w-8 h-8 rounded-xl bg-white text-orange-600 flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-headline font-black text-orange-600 text-sm px-2">
                {quantityInCart}
              </span>
              <button
                onClick={() => onUpdateQuantity(product, 1)}
                className="w-8 h-8 rounded-xl bg-white text-gray-700 border border-gray-200/80 flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
