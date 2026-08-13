import React from 'react';
import type { CategoryMenu } from '../../types';
import { UtensilsCrossed } from 'lucide-react';

interface CategoryTabsProps {
  categories: CategoryMenu[];
  activeCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide no-scrollbar">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-headline font-bold whitespace-nowrap transition-all shadow-sm cursor-pointer ${
          activeCategoryId === null
            ? 'bg-orange-600 text-white shadow-orange-500/20'
            : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
        }`}
      >
        Tất cả món
      </button>

      {categories.map((cat) => (
        <button
          key={cat.categoryId}
          onClick={() => onSelectCategory(cat.categoryId)}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-headline font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
            activeCategoryId === cat.categoryId
              ? 'bg-orange-600 text-white shadow-orange-500/20'
              : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>{cat.categoryName}</span>
        </button>
      ))}
    </div>
  );
};
