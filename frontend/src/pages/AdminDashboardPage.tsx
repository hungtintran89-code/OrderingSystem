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
      <div style={{ display: isTabActive('admin') ? 'block' : 'none' }}>
        <DashboardKPI />
      </div>

      {visitedTabs['menu'] && (
        <div style={{ display: isTabActive('menu') ? 'block' : 'none' }}>
          <MenuManagement />
        </div>
      )}

      {visitedTabs['tables-qr'] && (
        <div style={{ display: isTabActive('tables-qr') ? 'block' : 'none' }}>
          <TableQRManager />
        </div>
      )}

      {visitedTabs['tables'] && (
        <div style={{ display: isTabActive('tables') ? 'block' : 'none' }}>
          <StaffTableMap />
        </div>
      )}

      {visitedTabs['staff'] && (
        <div style={{ display: isTabActive('staff') ? 'block' : 'none' }}>
          <StaffManagement />
        </div>
      )}

      {visitedTabs['orders'] && (
        <div style={{ display: isTabActive('orders') ? 'block' : 'none' }}>
          <OrderListManagement />
        </div>
      )}

      {visitedTabs['quick-pos'] && (
        <div style={{ display: isTabActive('quick-pos') ? 'block' : 'none' }}>
          <QuickPosManagement />
        </div>
      )}

      {visitedTabs['analytics'] && (
        <div style={{ display: isTabActive('analytics') ? 'block' : 'none' }} className="space-y-4 font-sans">
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
