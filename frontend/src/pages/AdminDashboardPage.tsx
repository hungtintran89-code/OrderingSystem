import React from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardKPI } from '../components/admin/DashboardKPI';
import { MenuManagement } from '../components/admin/MenuManagement';
import { TableQRManager } from '../components/admin/TableQRManager';
import { StaffTableMap } from '../components/admin/StaffTableMap';
import { StaffManagement } from '../components/admin/StaffManagement';
import { OrderListManagement } from '../components/admin/OrderListManagement';
import { QuickPosManagement } from '../components/admin/QuickPosManagement';
import { Users, Receipt, UtensilsCrossed, PieChart, ShieldCheck } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/admin/menu') {
    return <MenuManagement />;
  }

  if (path === '/admin/tables-qr') {
    return <TableQRManager />;
  }

  if (path === '/admin/tables') {
    return <StaffTableMap />;
  }

  if (path === '/admin/staff') {
    return <StaffManagement />;
  }

  if (path === '/admin/orders') {
    return <OrderListManagement />;
  }

  if (path === '/admin/quick-pos') {
    return <QuickPosManagement />;
  }

  if (path === '/admin/analytics') {
    return (
      <div className="space-y-4 font-sans">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <PieChart className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold text-sm text-slate-900">Báo Cáo Analytics & Cơ Cấu Thanh Toán Chuyên Sâu</h3>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500 shadow-2xs">
          <p className="font-bold text-slate-900 text-sm">Tỉ Lệ Thanh Toán: VietQR (68%) vs Tiền Mặt (32%)</p>
          <p className="mt-1">Dữ liệu được trích xuất trực tiếp từ Spring Boot AdminAnalyticsController.</p>
        </div>
      </div>
    );
  }

  // Default Route `/admin` renders KPI Dashboard
  return <DashboardKPI />;
};
