import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KitchenLayout, StaffLayout, AdminLayout } from './layouts';
import { KitchenKiosk } from './pages/kitchen/KitchenKiosk';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { LoginPage } from './modules/management/auth/pages/LoginPage';
import CustomerApp from './modules/client/pages/CustomerApp';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROUTE 0: LOGIN PAGE WITH ROLE AUTHENTICATION */}
        <Route path="/login" element={<LoginPage />} />

        {/* ROUTE 1: CLIENT CUSTOMER APP (Giao diện Khách Đặt Món tại Bàn từ bạn của bạn) */}
        <Route path="/" element={<CustomerApp />} />
        <Route path="/client" element={<CustomerApp />} />

        {/* ROUTE 2: KITCHEN LAYOUT (Kitchen Display System - KDS) */}
        <Route path="/kitchen" element={<KitchenLayout kitchenName="Bếp Chính - Khu A" />}>
          <Route index element={<KitchenKiosk />} />
        </Route>

        {/* ROUTE 3: STAFF LAYOUT (Giao diện Nhân viên POS) */}
        <Route path="/staff" element={<StaffLayout staffName="Nguyễn Văn Phục Vụ" />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="tables" element={<StaffDashboardPage />} />
          <Route path="orders" element={<StaffDashboardPage />} />
          <Route path="quick-pos" element={<StaffDashboardPage />} />
        </Route>

        {/* ROUTE 4: ADMIN LAYOUT (Quản trị viên Hệ thống) */}
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
