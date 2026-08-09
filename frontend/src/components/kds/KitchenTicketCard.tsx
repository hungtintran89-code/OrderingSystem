import React, { useState, useEffect } from 'react';
import { KitchenOrder, OrderStatus } from '../../types/kds';
import { Clock, Play, Check, CheckCircle2, Lock } from 'lucide-react';

interface KitchenTicketCardProps {
  order: KitchenOrder;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onToggleItem: (orderId: string, itemId: string) => void;
}

export const KitchenTicketCard: React.FC<KitchenTicketCardProps> = ({
  order,
  onUpdateStatus,
  onToggleItem,
}) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Live timer calculation
  useEffect(() => {
    const calculateElapsed = () => {
      const createdTime = new Date(order.createdAt).getTime();
      const diffMs = Date.now() - createdTime;
      const mins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      setElapsedMinutes(mins);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 30000); // Update every 30 sec
    return () => clearInterval(interval);
  }, [order.createdAt]);

  // Urgency Classification
  const isRedUrgent = elapsedMinutes >= 15;
  const isAmberWarning = elapsedMinutes >= 5 && elapsedMinutes < 15;

  const timerBadgeClass = isRedUrgent
    ? 'bg-rose-50 text-rose-700 border border-rose-200/80 font-bold'
    : isAmberWarning
    ? 'bg-amber-50 text-amber-800 border border-amber-200/80 font-bold'
    : 'bg-slate-100 text-slate-600 border border-slate-200 font-medium';

  const completedCount = order.items.filter((i) => i.isCompleted).length;
  const totalCount = order.items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allItemsCompleted = completedCount === totalCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between overflow-hidden transition-all hover:shadow-md">
      
      {/* Clean Visual Completion Progress Bar */}
      <div className="w-full bg-slate-100 h-1 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 1. Ticket Header - Clean & Balanced */}
      <div className="p-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-900 leading-tight">
              {order.tableName}
            </h3>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">
              {order.orderCode}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
            Tiến độ: {completedCount}/{totalCount} món ({progressPercent}%)
          </span>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${timerBadgeClass}`}>
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{elapsedMinutes} phút</span>
        </div>
      </div>

      {/* 2. Ticket Items List - Clean Minimalist Spacing */}
      <div className="p-3.5 space-y-2 flex-1 overflow-y-auto max-h-80 divide-y divide-slate-100">
        {order.items.map((item) => (
          <div
            key={item.id}
            onClick={() => onToggleItem(order.id, item.id)}
            className={`pt-2 first:pt-0 space-y-1 cursor-pointer select-none transition-all ${
              item.isCompleted
                ? 'bg-emerald-50/50 p-2 rounded-xl border border-emerald-100'
                : 'p-1 hover:bg-slate-50 rounded-xl'
            }`}
            title="Chạm vào để tick món đã chế biến xong"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                    item.isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white hover:border-orange-400'
                  }`}
                >
                  {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span
                  className={`font-semibold text-xs sm:text-sm leading-snug truncate ${
                    item.isCompleted ? 'line-through text-emerald-800' : 'text-slate-900'
                  }`}
                >
                  {item.name}
                </span>
              </div>

              <span className="bg-orange-50 text-orange-700 border border-orange-200/60 font-bold text-xs px-2 py-0.5 rounded-md flex-shrink-0">
                x{item.quantity}
              </span>
            </div>

            {/* Notes Highlight Box */}
            {item.note && (
              <div className="bg-amber-50/70 border border-amber-200/60 p-2 rounded-lg text-[11px] text-amber-900 font-medium leading-tight ml-7">
                📌 <strong>Ghi chú:</strong> {item.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Ergonomic Touch Action Button */}
      <div className="p-3 bg-slate-50/50 border-t border-slate-100">
        {order.status === 'PENDING' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'IN_PROGRESS')}
            className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Bắt Đầu Chế Biến ({completedCount}/{totalCount} món)</span>
          </button>
        )}

        {order.status === 'IN_PROGRESS' && (
          <button
            onClick={() => {
              if (allItemsCompleted) {
                onUpdateStatus(order.id, 'READY');
              }
            }}
            disabled={!allItemsCompleted}
            className={`w-full h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
              allItemsCompleted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {allItemsCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>✓ Hoàn Thành & Trả Đơn Bếp</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>⏳ Cần tick chọn hết món ({completedCount}/{totalCount} món)</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
