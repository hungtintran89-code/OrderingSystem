import React from 'react';
import { useLocation } from 'react-router-dom';
import { StaffTableMap } from '../components/admin/StaffTableMap';
import { OrderListManagement } from '../components/admin/OrderListManagement';
import { QuickPosManagement } from '../components/admin/QuickPosManagement';

export const StaffDashboardPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/staff/orders') {
    return <OrderListManagement />;
  }

  if (path === '/staff/quick-pos') {
    return <QuickPosManagement />;
  }

  // Default Route `/staff` or `/staff/tables` renders StaffTableMap
  return <StaffTableMap />;
};
