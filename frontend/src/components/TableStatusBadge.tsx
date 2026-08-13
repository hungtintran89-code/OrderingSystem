import React from 'react';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'STAFF_CALLED';

interface TableStatusBadgeProps {
  status: TableStatus;
  tableNumber?: string | number;
  tableName?: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TABLE_STATUS_CONFIG: Record<
  TableStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string; badgeColor: string }
> = {
  AVAILABLE: {
    label: 'Bàn Trống',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300',
    dotClass: 'bg-emerald-500',
    badgeColor: '#16A34A',
  },
  OCCUPIED: {
    label: 'Đang Ăn',
    bgClass: 'bg-orange-50 hover:bg-orange-100',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    dotClass: 'bg-orange-500',
    badgeColor: '#EA580C',
  },
  BILL_REQUESTED: {
    label: 'Cần Tính Tiền',
    bgClass: 'bg-red-50 hover:bg-red-100 animate-pulse',
    textClass: 'text-red-700 font-bold',
    borderClass: 'border-red-400',
    dotClass: 'bg-red-600 animate-ping',
    badgeColor: '#DC2626',
  },
  STAFF_CALLED: {
    label: 'Gọi Phục Vụ',
    bgClass: 'bg-amber-50 hover:bg-amber-100',
    textClass: 'text-amber-800 font-bold',
    borderClass: 'border-amber-400',
    dotClass: 'bg-amber-500 animate-bounce',
    badgeColor: '#D97706',
  },
};

export const TableStatusBadge: React.FC<TableStatusBadgeProps> = ({
  status,
  tableNumber,
  tableName,
  onClick,
  className = '',
  size = 'md',
}) => {
  const config = TABLE_STATUS_CONFIG[status] || TABLE_STATUS_CONFIG.AVAILABLE;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-sm gap-2 min-h-[36px]',
    lg: 'px-4 py-2 text-base gap-2.5 min-h-[44px]',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center rounded-full border transition-all duration-200 cursor-pointer ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses} ${className}`}
      role="button"
      tabIndex={0}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${config.dotClass}`} />
      <span className="font-semibold">{tableName || (tableNumber ? `Bàn ${tableNumber}` : config.label)}</span>
      {tableNumber && <span className="opacity-75 text-xs font-normal">({config.label})</span>}
    </div>
  );
};

export default TableStatusBadge;
