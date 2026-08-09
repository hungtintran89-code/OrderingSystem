import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClientLayout, KitchenLayout, StaffLayout, AdminLayout } from './layouts';
import { KitchenKiosk } from './pages/kitchen/KitchenKiosk';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROUTE 0: LOGIN PAGE WITH ROLE AUTHENTICATION */}
        <Route path="/login" element={<LoginPage />} />

        {/* LAYOUT 1: CLIENT LAYOUT (Dine-in Menu) */}
        <Route path="/" element={<ClientLayout tableName="Bàn 08 - Tầng 1" cartItemCount={2} />}>
          <Route
            index
            element={
              <div className="space-y-4 text-center py-12">
                <h3 className="font-semibold text-lg text-slate-800">Thực Đơn Món Ăn Tại Bàn</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  Chào mừng quý khách! Hãy chọn các món ăn bạn ưa thích và bấm gửi đơn đặt món.
                </p>
              </div>
            }
          />
        </Route>

        {/* LAYOUT 2: KITCHEN LAYOUT (Kitchen Display System - KDS) */}
        <Route path="/kitchen" element={<KitchenLayout kitchenName="Bếp Chính - Khu A" />}>
          <Route index element={<KitchenKiosk />} />
        </Route>

        {/* LAYOUT 3: STAFF LAYOUT (Giao diện Nhân viên POS) */}
        <Route path="/staff" element={<StaffLayout staffName="Nguyễn Văn Phục Vụ" />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="tables" element={<StaffDashboardPage />} />
          <Route path="orders" element={<StaffDashboardPage />} />
          <Route path="quick-pos" element={<StaffDashboardPage />} />
        </Route>

        {/* LAYOUT 4: ADMIN LAYOUT (Quản trị viên Hệ thống) */}
        <Route path="/admin" element={<AdminLayout userName="Trần Văn Quản Lý" userRole="Super Admin" />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="tables" element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminDashboardPage />} />
          <Route path="quick-pos" element={<AdminDashboardPage />} />
          <Route path="menu" element={<AdminDashboardPage />} />
          <Route path="tables-qr" element={<AdminDashboardPage />} />
          <Route path="staff" element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminDashboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
