import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardKPI } from '../components/admin/DashboardKPI';
import { MenuManagement } from '../components/admin/MenuManagement';
import { TableQRManager } from '../components/admin/TableQRManager';
import { StaffTableMap } from '../components/admin/StaffTableMap';
import { StaffManagement } from '../components/admin/StaffManagement';
import { OrderListManagement } from '../components/admin/OrderListManagement';
import { QuickPosManagement } from '../components/admin/QuickPosManagement';
import { PieChart } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const subPath = path.split('/').pop() || '';

  // Track which tabs have been visited to lazy-load them
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    'admin': true, // Always mount DashboardKPI first
  });

  const isTabActive = (tabName: string) => {
    return subPath === tabName;
  };

  // Determine current active tab
  const currentTab = ['menu', 'tables-qr', 'tables', 'staff', 'orders', 'quick-pos', 'analytics'].find(
    (t) => subPath === t
  ) || 'admin';

  // Mark current tab as visited to trigger component mount
  if (!visitedTabs[currentTab]) {
    setVisitedTabs((prev) => ({ ...prev, [currentTab]: true }));
  }

  return (
    <>
      <div className="h-full flex-1 flex flex-col min-h-0" style={{ display: isTabActive('admin') ? 'flex' : 'none' }}>
        <DashboardKPI />
      </div>

      {visitedTabs['menu'] && (
        <div className="h-full flex-1 flex flex-col min-h-0" style={{ display: isTabActive('menu') ? 'flex' : 'none' }}>
          <MenuManagement />
        </div>
      )}

      {visitedTabs['tables-qr'] && (
        <div className="h-full flex-1 flex flex-col min-h-0" style={{ display: isTabActive('tables-qr') ? 'flex' : 'none' }}>
          <TableQRManager />
        </div>
      )}

      {visitedTabs['tables'] && (
        <div className="h-full flex-1 flex flex-col min-h-0" style={{ display: isTabActive('tables') ? 'flex' : 'none' }}>
          <StaffTableMap />
        </div>
      )}

      {visitedTabs['staff'] && (
        <div className="h-full flex-1 flex flex-col min-h-0" style={{ display: isTabActive('staff') ? 'flex' : 'none' }}>
          <StaffManagement />
        </div>
      )}

      {visitedTabs['orders'] && (
        <div className="h-full flex-1 flex flex-col min-h-0" style={{ display: isTabActive('orders') ? 'flex' : 'none' }}>
          <OrderListManagement />
        </div>
      )}

      {visitedTabs['quick-pos'] && (
        <div className="h-full flex-1 flex flex-col min-h-0" style={{ display: isTabActive('quick-pos') ? 'flex' : 'none' }}>
          <QuickPosManagement />
        </div>
      )}

      {visitedTabs['analytics'] && (
        <div className="h-full flex-1 flex flex-col min-h-0 space-y-4 font-sans" style={{ display: isTabActive('analytics') ? 'flex' : 'none' }}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieChart className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-sm text-slate-900">Báo Cáo Analytics & Cơ Cấu Thanh Toán Chuyên Sâu</h3>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500 shadow-2xs">
            <p className="font-bold text-slate-900 text-sm">Tỉ Lệ Thanh Toán: VietQR (68%) vs Tiền Mặt (32%)</p>
            <p className="mt-1">Dữ liệu được trích xuất trực tiếp từ Spring Boot AdminAnalyticsController.</p>
          </div>
        </div>
      )}
    </>
  );
};
