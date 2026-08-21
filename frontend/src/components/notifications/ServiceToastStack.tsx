import React from 'react';
import { useServiceRequests } from '../../context/ServiceRequestContext';
import { Bell, CreditCard, Check, X } from 'lucide-react';

export const ServiceToastStack: React.FC = () => {
  const { toasts, handleConfirmRequest, dismissToast } = useServiceRequests();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-18 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none font-sans">
      {toasts.map((toast) => {
        const isBill =
          toast.requestType &&
          (toast.requestType.includes('BILL') || toast.requestType.includes('PAYMENT'));
        const cardBg = isBill ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
        const iconBg = isBill ? 'bg-red-600' : 'bg-amber-500';
        const progressBg = isBill ? 'bg-red-500' : 'bg-amber-500';
        const labelText = isBill ? 'Yêu cầu tính tiền' : 'Gọi phục vụ tại bàn';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-lg transition-all duration-400 transform ${
              toast.isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100 animate-slide-down'
            } ${cardBg} p-3.5`}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Left Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${iconBg} text-white flex items-center justify-center shadow-md flex-shrink-0`}>
                  {isBill ? <CreditCard className="w-5 h-5" /> : <Bell className="w-5 h-5 animate-bounce" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {toast.tableName || `Bàn ${toast.tableId}`}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 shadow-2xs text-slate-700">
                      {labelText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    {isBill ? 'Khách yêu cầu thanh toán hóa đơn' : 'Cần hỗ trợ thông tin hoặc gọi món'}
                  </p>
                </div>
              </div>

              {/* Right Action: 1-Tap Confirm Button */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleConfirmRequest(toast.id)}
                  className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                  title="Xác nhận xử lý tức thì (1-Tap UX)"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Xác nhận</span>
                </button>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                  title="Ẩn thông báo vào chuông"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3s Independent Countdown Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 overflow-hidden">
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
