import React, { useState, useEffect } from 'react';
import { Switch, Tag, Badge, Button, Tabs, message } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import TableStatusBadge, { TableStatus } from '../components/TableStatusBadge';

interface StaffKitchenLayoutProps {
  children?: React.ReactNode;
  activeTabKey?: string;
}

export const StaffKitchenLayout: React.FC<StaffKitchenLayoutProps> = ({ children, activeTabKey = 'kitchen-kanban' }) => {
  const [soundAlert, setSoundAlert] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>(activeTabKey);
  const navigate = useNavigate();

  // Clock Timer effect
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
          ' - ' +
          now.toLocaleDateString('vi-VN')
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSoundToggle = (checked: boolean) => {
    setSoundAlert(checked);
    if (checked) {
      message.success('🔊 Đã bật âm thanh thông báo đơn mới!');
    } else {
      message.warning('🔇 Đã tắt âm thanh thông báo');
    }
  };

  const sampleTables: { id: number; number: number; status: TableStatus; itemsCount: number; timeAgo: string }[] = [
    { id: 1, number: 1, status: 'AVAILABLE', itemsCount: 0, timeAgo: '-' },
    { id: 2, number: 2, status: 'OCCUPIED', itemsCount: 4, timeAgo: '18 phút' },
    { id: 3, number: 3, status: 'BILL_REQUESTED', itemsCount: 6, timeAgo: '42 phút' },
    { id: 4, number: 4, status: 'STAFF_CALLED', itemsCount: 2, timeAgo: '5 phút' },
    { id: 5, number: 5, status: 'OCCUPIED', itemsCount: 3, timeAgo: '12 phút' },
    { id: 6, number: 6, status: 'AVAILABLE', itemsCount: 0, timeAgo: '-' },
    { id: 7, number: 7, status: 'BILL_REQUESTED', itemsCount: 5, timeAgo: '35 phút' },
    { id: 8, number: 8, status: 'AVAILABLE', itemsCount: 0, timeAgo: '-' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-body select-none">
      {/* 1. FIXED KIOSK HEADER */}
      <header className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Shift Info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-orange-600/40">
              🍳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white font-heading tracking-wide">STAFF & KITCHEN KIOSK</h1>
                <Tag color="green" className="font-bold text-xs px-2.5 py-0.5 rounded-full border-none">
                  Ca Sáng (07:00 - 15:00)
                </Tag>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">🕒 {currentTime || 'Đang tải...'}</p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs">
            <div className="px-3 py-1 bg-slate-800 rounded-xl text-center">
              <span className="text-slate-400 block text-[10px]">Bàn Đang Ngồi</span>
              <strong className="text-orange-400 text-sm">5 / 12</strong>
            </div>
            <div className="px-3 py-1 bg-slate-800 rounded-xl text-center">
              <span className="text-slate-400 block text-[10px]">Đơn Chờ Bếp</span>
              <strong className="text-red-400 text-sm animate-pulse">3 Đơn</strong>
            </div>
            <div className="px-3 py-1 bg-slate-800 rounded-xl text-center">
              <span className="text-slate-400 block text-[10px]">Yêu Cầu Phục Vụ</span>
              <strong className="text-amber-400 text-sm">2 Yêu Cầu</strong>
            </div>
          </div>

          {/* Sound Toggle & Admin Exit */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-sm font-semibold">{soundAlert ? '🔊 Chuông: Bật' : '🔇 Chuông: Tắt'}</span>
              <Switch checked={soundAlert} onChange={handleSoundToggle} className="bg-slate-700" />
            </div>

            <Button
              onClick={() => navigate('/app/admin')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-bold rounded-xl h-10 text-xs"
            >
              ⚙️ Admin Portal
            </Button>
          </div>
        </div>
      </header>

      {/* 2. QUICK NAVIGATION TABS */}
      <nav className="bg-slate-950/80 border-b border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 py-2 overflow-x-auto">
            {[
              { id: 'kitchen-kanban', label: '👨‍🍳 1. Đơn Chờ Bếp (Kanban Board)', badge: 3, badgeColor: 'red' },
              { id: 'tables-grid', label: '🪑 2. Sơ Đồ & Trạng Thái Bàn', badge: 2, badgeColor: 'gold' },
              { id: 'cashier-orders', label: '🧾 3. Thu Ngân & Đơn Hàng', badge: null, badgeColor: undefined },
            ].map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`px-5 py-3 rounded-xl font-bold text-sm md:text-base flex items-center gap-2.5 transition-all cursor-pointer min-h-[48px] ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-102'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <Badge count={tab.badge} overflowCount={99} color={tab.badgeColor} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. MAIN DISPLAY AREA (Realtime Outlet) */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full overflow-hidden flex flex-col min-h-0">
        {currentTab === 'tables-grid' ? (
          <div className="space-y-4">
            {/* Status Legend */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="text-slate-400">Chú thích trạng thái:</span>
              <TableStatusBadge status="AVAILABLE" size="sm" />
              <TableStatusBadge status="OCCUPIED" size="sm" />
              <TableStatusBadge status="BILL_REQUESTED" size="sm" />
              <TableStatusBadge status="STAFF_CALLED" size="sm" />
            </div>

            {/* Interactive Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sampleTables.map((tbl) => (
                <div
                  key={tbl.id}
                  className={`p-4 rounded-2xl border-2 bg-slate-950 transition-all duration-200 hover:scale-105 cursor-pointer flex flex-col justify-between min-h-[140px] shadow-lg ${
                    tbl.status === 'BILL_REQUESTED'
                      ? 'border-red-500 shadow-red-500/20 animate-pulse'
                      : tbl.status === 'STAFF_CALLED'
                      ? 'border-amber-500 shadow-amber-500/20'
                      : tbl.status === 'OCCUPIED'
                      ? 'border-orange-500/80'
                      : 'border-slate-800 hover:border-emerald-500/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-lg text-white font-heading">Bàn {tbl.number}</h3>
                    <TableStatusBadge status={tbl.status} size="sm" />
                  </div>

                  <div className="my-2 space-y-1 text-xs text-slate-400">
                    <p>Món đã gọi: <strong className="text-slate-200">{tbl.itemsCount} món</strong></p>
                    <p>Thời gian ngồi: <strong className="text-slate-200">{tbl.timeAgo}</strong></p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex gap-2">
                    <Button size="small" type="primary" className="flex-1 rounded-lg text-xs bg-orange-600 font-bold border-none">
                      Xem Đơn
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : children ? (
          children
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default StaffKitchenLayout;
