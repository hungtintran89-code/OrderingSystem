import React from 'react';
import { useServiceRequests } from '../../context/ServiceRequestContext';
import { Bell, CreditCard, Check, X } from 'lucide-react';

export const ServiceToastStack: React.FC = () => {
  const { toasts, dismissToast } = useServiceRequests();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-18 right-4 z-50 flex flex-col gap-2 max-w-[290px] w-full pointer-events-none select-none font-sans">
      {toasts.map((toast) => {
        const isBill =
          toast.requestType &&
          (toast.requestType.includes('BILL') || toast.requestType.includes('PAYMENT'));
        const cardBg = isBill ? 'bg-red-50/95 border-red-200' : 'bg-amber-50/95 border-amber-200';
        const iconBg = isBill ? 'bg-red-600' : 'bg-amber-500';
        const progressBg = isBill ? 'bg-red-500' : 'bg-amber-500';
        const labelText = isBill ? 'Tính tiền' : 'Gọi phục vụ';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-md transition-all duration-300 transform ${
              toast.isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100 animate-slide-down'
            } ${cardBg} p-2.5`}
          >
            <div className="flex items-center justify-between gap-2">
              {/* Left Info */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-lg ${iconBg} text-white flex items-center justify-center shadow-xs flex-shrink-0`}>
                  {isBill ? <CreditCard className="w-4 h-4" /> : <Bell className="w-4 h-4 animate-bounce" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900 truncate">
                      {toast.tableName || `Bàn ${toast.tableId}`}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/90 border border-slate-200 shadow-2xs text-slate-700">
                      {labelText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    {isBill ? 'Khách yêu cầu thanh toán' : 'Cần hỗ trợ tại bàn'}
                  </p>
                </div>
              </div>

              {/* Right Action: Close/Dismiss Toast into Bell Drawer */}
              <div className="flex items-center flex-shrink-0">
                <button
                  onClick={() => dismissToast(toast.id || toast.requestId!)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                  title="Ẩn thông báo vào chuông"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3s Independent Countdown Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ease-linear ${progressBg}`}
                style={{ width: `${toast.progressPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
