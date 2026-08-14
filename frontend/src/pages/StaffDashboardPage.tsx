import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StaffTableMap } from '../components/admin/StaffTableMap';
import { OrderListManagement } from '../components/admin/OrderListManagement';
import { QuickPosManagement } from '../components/admin/QuickPosManagement';

export const StaffDashboardPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const subPath = path.split('/').pop() || '';

  // Track which tabs have been visited to lazy-load them
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    'tables': true, // Always mount StaffTableMap first
  });

  const isTabActive = (tabName: string) => {
    if (tabName === 'tables') {
      return subPath === 'tables' || subPath === 'staff';
    }
    return subPath === tabName;
  };

  // Determine current active tab
  const currentTab = ['orders', 'quick-pos'].find(
    (t) => subPath === t
  ) || 'tables';

  // Mark current tab as visited to trigger component mount
  if (!visitedTabs[currentTab]) {
    setVisitedTabs((prev) => ({ ...prev, [currentTab]: true }));
  }

  return (
    <>
      <div style={{ display: isTabActive('tables') ? 'block' : 'none' }}>
        <StaffTableMap />
      </div>

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
    </>
  );
};
