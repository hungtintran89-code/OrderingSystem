import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KitchenLayout, StaffLayout, AdminLayout } from './layouts';
import { KitchenKiosk } from './pages/kitchen/KitchenKiosk';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { LoginPage } from './modules/management/auth/pages/LoginPage';
import CustomerApp from './modules/client/pages/CustomerApp';

import { ProtectedRoute } from './components/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROUTE 1: CLIENT CUSTOMER APP (Giao diện Khách Đặt Món tại Bàn) */}
        <Route path="/client" element={<CustomerApp />} />
        <Route path="/menu" element={<CustomerApp />} />
        <Route path="/table/:tableId" element={<CustomerApp />} />
        <Route path="/" element={<Navigate to="/client" replace />} />

        {/* ROUTE 2: MANAGEMENT & STAFF PORTAL (/app) */}
        <Route path="/app/login" element={<LoginPage />} />

        {/* KITCHEN LAYOUT (Kitchen Display System - KDS) */}
        <Route
          path="/app/kitchen"
          element={
            <ProtectedRoute allowedRoles={['KITCHEN', 'CHEF', 'MANAGER', 'ADMIN']}>
              <KitchenLayout kitchenName="Bếp Chính - Khu A" />
            </ProtectedRoute>
          }
        >
          <Route index element={<KitchenKiosk />} />
        </Route>

        {/* STAFF LAYOUT (Giao diện Nhân viên POS) */}
        <Route
          path="/app/staff"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'WAITER', 'MANAGER', 'ADMIN']}>
              <StaffLayout staffName="Nguyễn Văn Phục Vụ" />
            </ProtectedRoute>
          }
        >
          <Route index element={<StaffDashboardPage />} />
          <Route path="tables" element={<StaffDashboardPage />} />
          <Route path="orders" element={<StaffDashboardPage />} />
          <Route path="quick-pos" element={<StaffDashboardPage />} />
        </Route>

        {/* ADMIN LAYOUT (Quản trị viên Hệ thống) */}
        <Route
          path="/app/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SUPER_ADMIN']}>
              <AdminLayout userName="Trần Văn Quản Lý" userRole="Super Admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="tables" element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminDashboardPage />} />
          <Route path="quick-pos" element={<AdminDashboardPage />} />
          <Route path="menu" element={<AdminDashboardPage />} />
          <Route path="tables-qr" element={<AdminDashboardPage />} />
          <Route path="staff" element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminDashboardPage />} />
        </Route>

        {/* ROOT /app REDIRECT */}
        <Route path="/app" element={<Navigate to="/app/login" replace />} />

        {/* BACKWARD COMPATIBILITY REDIRECTS */}
        <Route path="/login" element={<Navigate to="/app/login" replace />} />
        <Route path="/kitchen" element={<Navigate to="/app/kitchen" replace />} />
        <Route path="/staff" element={<Navigate to="/app/staff" replace />} />
        <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
        <Route path="/admin/*" element={<Navigate to="/app/admin" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/client" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
