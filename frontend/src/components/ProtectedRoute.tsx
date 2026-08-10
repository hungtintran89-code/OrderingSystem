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
  const userRole = (localStorage.getItem('user_role') || '').toUpperCase();

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
      const normalizedRole = role.toUpperCase();
      if (normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER' || normalizedRole === 'SUPER_ADMIN') {
        return ['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);
      }
      if (normalizedRole === 'STAFF' || normalizedRole === 'WAITER') {
        return ['STAFF', 'WAITER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);
      }
      if (normalizedRole === 'KITCHEN' || normalizedRole === 'CHEF') {
        return ['KITCHEN', 'CHEF', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);
      }
      return userRole.includes(normalizedRole);
    });

    if (!hasPermission) {
      message.error({
        content: 'Bạn không có quyền truy cập vào phân hệ này!',
        key: 'rbac-denied-warning',
        duration: 3,
      });

      // Redirect user to their own role's home page
      if (['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(userRole)) {
        return <Navigate to="/app/admin" replace />;
      } else if (userRole.includes('KITCHEN') || userRole.includes('CHEF')) {
        return <Navigate to="/app/kitchen" replace />;
      } else {
        return <Navigate to="/app/staff" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
