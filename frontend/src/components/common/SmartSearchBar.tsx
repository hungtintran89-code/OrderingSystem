import React, { useState, useEffect, useRef } from 'react';
import { AdminMenuItem } from '../../types/admin';
import {
  removeVietnameseTones,
  isVietnameseMatch,
  getHighlightedSegments,
} from '../../utils/vietnameseSearch';
import {
  Search,
  X,
  Tag,
  Utensils,
  AlertCircle,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';

interface SmartSearchBarProps {
  items: AdminMenuItem[];
  selectedCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectItem?: (item: AdminMenuItem) => void;
  onClearCategoryFilter?: () => void;
  placeholder?: string;
  showDropdown?: boolean;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  items,
  selectedCategory,
  searchQuery,
  onSearchChange,
  onSelectItem,
  onClearCategoryFilter,
  placeholder = 'Tìm tên món (vd: Nu, Ga, Lau)...',
  showDropdown = false,
}) => {
  // Input local state for instant typing & debouncing
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync prop changes
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // DEBOUNCE EFFECT: Delay 250ms before calling onSearchChange
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(inputValue);
    }, 250);

    return () => clearTimeout(timer);
  }, [inputValue, onSearchChange]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Logic:
  // 1. Contextual Filter within selected category
  const activeCategoryItems =
    selectedCategory === 'Tất cả'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  let suggestions = activeCategoryItems.filter(
    (item) =>
      isVietnameseMatch(item.name, inputValue) ||
      isVietnameseMatch(item.sku, inputValue) ||
      isVietnameseMatch(item.category, inputValue)
  );

  // Fallback: If 0 matches in current category, search across all items
  let isCrossCategory = false;
  if (suggestions.length === 0 && selectedCategory !== 'Tất cả' && inputValue.trim().length > 0) {
    const globalMatches = items.filter(
      (item) =>
        isVietnameseMatch(item.name, inputValue) ||
        isVietnameseMatch(item.sku, inputValue)
    );
    if (globalMatches.length > 0) {
      suggestions = globalMatches;
      isCrossCategory = true;
    }
  }

  // Limit suggestions to top 6 items
  const displaySuggestions = suggestions.slice(0, 6);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && inputValue.trim().length > 0) {
      setIsOpen(true);
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < displaySuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : displaySuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < displaySuggestions.length) {
        handleSelectItem(displaySuggestions[selectedIndex]);
      } else {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectItem = (item: AdminMenuItem) => {
    setInputValue(item.name);
    onSearchChange(item.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onSelectItem) {
      onSelectItem(item);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onSearchChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  return (
    <div ref={containerRef} className="relative w-full sm:w-72 md:w-80">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all outline-none shadow-2xs"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Xóa từ khóa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Popup */}
      {showDropdown && isOpen && inputValue.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden text-xs animate-in fade-in duration-150 max-h-[380px] flex flex-col">
          {/* Contextual Banner Notice if Cross-Category match */}
          {isCrossCategory && (
            <div className="bg-amber-50 border-b border-amber-100 px-3 py-1.5 text-[11px] font-medium text-amber-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Tìm thấy trong toàn bộ danh mục</span>
            </div>
          )}

          {/* Suggestions List */}
          {displaySuggestions.length > 0 ? (
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[320px]">
              {displaySuggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const nameSegments = getHighlightedSegments(item.name, inputValue);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-orange-50/80 border-l-3 border-orange-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Dish Info & Highlighted Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {nameSegments.map((seg, sIdx) =>
                          seg.isMatch ? (
                            <span key={sIdx} className="bg-orange-100 text-orange-700 font-bold px-0.5 rounded">
                              {seg.text}
                            </span>
                          ) : (
                            <span key={sIdx}>{seg.text}</span>
                          )
                        )}
                      </p>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {item.category}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-slate-500">{item.sku}</span>
                      </div>
                    </div>

                    {/* Price & Action Badge */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-900 text-xs">
                        {formatVND(item.price)}
                      </p>
                      {isSelected && (
                        <span className="text-[10px] text-orange-600 font-semibold inline-flex items-center gap-0.5 mt-0.5">
                          <CornerDownLeft className="w-3 h-3" /> Chọn
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="p-5 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs">Không tìm thấy món ăn nào</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Không có kết quả trùng khớp với từ khóa "<span className="font-semibold text-slate-700">{inputValue}</span>"
                </p>
              </div>

              {selectedCategory !== 'Tất cả' && onClearCategoryFilter && (
                <button
                  type="button"
                  onClick={() => {
                    onClearCategoryFilter();
                    setIsOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-[11px] border border-orange-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Tìm trên tất cả danh mục</span>
                </button>
              )}
            </div>
          )}

          {/* Footer keyboard hint */}
          {displaySuggestions.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400 flex items-center justify-between font-medium">
              <span>Dùng <kbd className="px-1 py-0.5 bg-white border rounded text-[9px] font-mono shadow-2xs">↑</kbd> <kbd className="px-1 py-0.5 bg-white border rounded text-[9px] font-mono shadow-2xs">↓</kbd> để di chuyển</span>
              <span><kbd className="px-1 py-0.5 bg-white border rounded text-[9px] font-mono shadow-2xs">Enter</kbd> để chọn</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
