import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { message } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const rawRole = (localStorage.getItem('user_role') || '').toUpperCase();
  const userRole = rawRole.replace(/^ROLE_/, '');

  // 1. Check Authentication: If no token exists, block rendering and redirect to /app/login
  if (!token) {
    message.warning({
      content: 'Vui lòng đăng nhập để truy cập hệ thống!',
      key: 'unauthorized-warning',
      duration: 3,
    });
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  // 2. Check Authorization (RBAC): If role is specified and user does not match
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some((role) => {
      const normalizedRole = role.toUpperCase().replace(/^ROLE_/, '');
      if (['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(normalizedRole)) {
        return ['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);
      }
      if (['STAFF', 'WAITER'].includes(normalizedRole)) {
        return ['STAFF', 'WAITER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);
      }
      if (['KITCHEN', 'CHEF'].includes(normalizedRole)) {
        return ['KITCHEN', 'CHEF', 'ADMIN', 'MANAGER', 'SUPER_ADMIN', 'STAFF'].includes(userRole);
      }
      return userRole.includes(normalizedRole);
    });

    if (!hasPermission) {
      let targetPath = '/app/staff';
      if (['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(userRole)) {
        targetPath = '/app/admin';
      } else if (['KITCHEN', 'CHEF'].includes(userRole)) {
        targetPath = '/app/kitchen';
      }

      if (location.pathname === targetPath) {
        return <>{children}</>;
      }

      message.error({
        content: 'Bạn không có quyền truy cập vào phân hệ này!',
        key: 'rbac-denied-warning',
        duration: 3,
      });

      return <Navigate to={targetPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
