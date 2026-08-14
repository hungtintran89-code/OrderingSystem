import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StaffTableMap } from '../components/admin/StaffTableMap';
import { OrderListManagement } from '../components/admin/OrderListManagement';
import { QuickPosManagement } from '../components/admin/QuickPosManagement';

export const StaffDashboardPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Track which tabs have been visited to lazy-load them
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    '/app/staff': true, // Always mount StaffTableMap first
    '/app/staff/tables': true, // Since it defaults to tables
  });

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/app/staff') {
      return path === '/app/staff' || path.endsWith('/tables') || path.includes('/tables');
    }
    return path.endsWith(tabPath) || path.includes(tabPath);
  };

  // Determine current active tab
  const currentTab = ['/orders', '/quick-pos'].find(
    (t) => path.endsWith(t) || path.includes(t)
  ) || '/app/staff';

  // Mark current tab as visited to trigger component mount
  if (!visitedTabs[currentTab]) {
    setVisitedTabs((prev) => ({ ...prev, [currentTab]: true }));
  }

  return (
    <>
      <div style={{ display: isTabActive('/app/staff') ? 'block' : 'none' }}>
        <StaffTableMap />
      </div>

      {visitedTabs['/orders'] && (
        <div style={{ display: isTabActive('/orders') ? 'block' : 'none' }}>
          <OrderListManagement />
        </div>
      )}

      {visitedTabs['/quick-pos'] && (
        <div style={{ display: isTabActive('/quick-pos') ? 'block' : 'none' }}>
          <QuickPosManagement />
        </div>
      )}
    </>
  );
};
