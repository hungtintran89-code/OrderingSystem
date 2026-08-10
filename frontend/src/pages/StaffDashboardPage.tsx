import React from 'react';
import { useLocation } from 'react-router-dom';
import { StaffTableMap } from '../components/admin/StaffTableMap';
import { OrderListManagement } from '../components/admin/OrderListManagement';
import { QuickPosManagement } from '../components/admin/QuickPosManagement';

export const StaffDashboardPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  if (path.endsWith('/orders') || path.includes('/orders')) {
    return <OrderListManagement />;
  }

  if (path.endsWith('/quick-pos') || path.includes('/quick-pos')) {
    return <QuickPosManagement />;
  }

  // Default Route `/app/staff` or `/app/staff/tables` renders StaffTableMap
  return <StaffTableMap />;
};
