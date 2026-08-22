import React from 'react';
import type { TableInfo } from '../../types';
import { ShoppingBag, History as HistoryIcon, Bell } from 'lucide-react';

import { HungTriFoodLogo } from '../../../../components/common/HungTriFoodLogo';

interface HeaderProps {
  currentTable: TableInfo;
  cartCount: number;
  onOpenCart: () => void;
  onOpenHistory: () => void;
  onOpenService?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTable,
  cartCount,
  onOpenCart,
  onOpenHistory,
  onOpenService,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <HungTriFoodLogo size="md" showText={false} />
          <div className="min-w-0">
            <h1 className="font-headline font-black text-base sm:text-xl text-gray-900 tracking-tight leading-tight truncate">
              Hùng Trí Food
            </h1>
            <p className="text-[11px] text-gray-500 font-label font-bold truncate">
              {currentTable.tableName}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Order History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 font-headline font-bold text-xs sm:text-sm transition-all active:scale-95 border border-gray-200/50 cursor-pointer"
            title="Lịch sử món đã đặt"
          >
            <HistoryIcon className="w-4 h-4 text-gray-600 shrink-0" />
            <span className="whitespace-nowrap">Lịch sử</span>
          </button>

          {/* Cart Trigger Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-headline font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <ShoppingBag className="w-4.5 h-4.5 shrink-0" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {cartCount > 0 && (
              <span className="bg-white text-orange-600 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
