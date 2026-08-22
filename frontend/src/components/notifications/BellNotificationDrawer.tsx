import React, { useState } from 'react';
import { useServiceRequests } from '../../context/ServiceRequestContext';
import { Bell, CreditCard, Check, X, Inbox } from 'lucide-react';
import { Drawer, Badge } from 'antd';

export const BellNotificationDrawer: React.FC = () => {
  const { pendingRequests, badgeCount, handleConfirmRequest } = useServiceRequests();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sort requests oldest-first for structured staff handling
  const sortedRequests = [...pendingRequests].reverse();

  return (
    <>
      {/* Header Bell Icon Button with Red Badge Counter */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
        title="Danh sách yêu cầu phục vụ từ khách hàng"
      >
        <Bell className={`w-5 h-5 ${badgeCount > 0 ? 'text-orange-600 animate-bounce' : 'text-slate-600'}`} />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white font-extrabold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {/* Sliding Drawer for Bell Menu Requests */}
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <span className="font-bold text-base text-slate-900">Danh Sách Yêu Cầu Phục Vụ</span>
            </div>
            {badgeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-extrabold text-xs">
                {badgeCount} chờ xử lý
              </span>
            )}
          </div>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={400}
        styles={{ body: { padding: '16px' } }}
      >
        {sortedRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Inbox className="w-12 h-12 mx-auto stroke-[1.5] text-slate-300" />
            <p className="font-semibold text-sm">Không có yêu cầu phục vụ nào đang chờ.</p>
            <p className="text-xs text-slate-400">Các yêu cầu từ khách hàng sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="space-y-3 font-sans">

            {sortedRequests.map((req, index) => {
              const isBill =
                req.requestType &&
                (req.requestType.includes('BILL') || req.requestType.includes('PAYMENT'));
              const cardBg = isBill ? 'bg-red-50/80 border-red-200' : 'bg-amber-50/80 border-amber-200';
              const iconBg = isBill ? 'bg-red-600' : 'bg-amber-500';
              const labelText = isBill ? 'Yêu cầu tính tiền' : 'Gọi phục vụ tại bàn';

              return (
                <div
                  key={req.id ? `req-${req.id}` : `table-${req.tableId || req.tableName}-${index}`}
                  className={`p-3.5 rounded-2xl border ${cardBg} shadow-sm flex items-center justify-between gap-3 transition-all`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} text-white flex items-center justify-center shadow-md flex-shrink-0`}>
                      {isBill ? <CreditCard className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {req.tableName || `Bàn ${req.tableId}`}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {labelText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">
                        {isBill ? 'Khách yêu cầu thanh toán bill' : 'Cần hỗ trợ tại bàn'}
                      </p>
                    </div>
                  </div>

                  {/* 1-Tap Confirm Button */}
                  <button
                    onClick={() => handleConfirmRequest(req.id || req.requestId!)}
                    className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer flex-shrink-0"
                    title="Đánh dấu hoàn tất xử lý"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Xác nhận</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Drawer>
    </>
  );
};
