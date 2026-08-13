import React, { useState } from 'react';
import { Breadcrumb, Dropdown, Drawer, Input, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  UtensilsCrossed,
  Receipt,
  Users,
  PieChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  Search,
  User,
  ArrowLeft
} from 'lucide-react';
import { UserProfileModal } from '../components/UserProfileModal';

interface AdminLayoutProps {
  children?: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  userName: initialUserName = 'Trần Văn Quản Lý',
  userRole = 'Super Admin',
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userName, setUserName] = useState(initialUserName);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Unified Menu Structure
  const menuGroups = [
    {
      title: 'QUẢN TRỊ HỆ THỐNG',
      items: [
        { key: '/app/admin', icon: LayoutGrid, label: 'Dashboard Tổng quan' },
        { key: '/app/admin/menu', icon: UtensilsCrossed, label: 'Quản lý Thực đơn & Topping' },
        { key: '/app/admin/tables-qr', icon: LayoutGrid, label: 'Quản lý Bàn & Mã QR' },
        { key: '/app/admin/staff', icon: Users, label: 'Quản lý Nhân viên & Quyền' },
        { key: '/app/admin/analytics', icon: PieChart, label: 'Báo cáo & Analytics' },
      ],
    },
    {
      title: 'VẬN HÀNH POS & PHỤC VỤ (STAFF)',
      items: [
        { key: '/app/admin/tables', icon: LayoutGrid, label: 'Sơ đồ & Danh sách Bàn' },
        { key: '/app/admin/orders', icon: Receipt, label: 'Danh sách Đơn hàng' },
        { key: '/app/admin/quick-pos', icon: UtensilsCrossed, label: 'Đặt món tại bàn (Quick POS)' },
      ],
    },
  ];

  const currentPath = location.pathname || '/app/admin';

  const handleMenuClick = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  // Handle Logout & Clear LocalStorage
  const handleLogout = () => {
    localStorage.clear();
    message.success('Đã đăng xuất thành công!');
    navigate('/app/login');
  };

  const userDropdownItems = [
    {
      key: 'profile',
      label: (
        <span className="flex items-center gap-2 text-xs font-semibold" onClick={() => setIsProfileOpen(true)}>
          <User className="w-3.5 h-3.5 text-slate-500" /> Hồ sơ cá nhân
        </span>
      ),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: (
        <span className="flex items-center gap-2 text-xs text-red-600 font-bold" onClick={handleLogout}>
          <LogOut className="w-3.5 h-3.5" /> Đăng xuất
        </span>
      ),
    },
  ];

  // Dynamic & Clickable Breadcrumb Items Generator
  const getBreadcrumbItems = () => {
    const routeTitles: Record<string, string> = {
      '/app/admin': 'Dashboard Tổng Quan',
      '/app/admin/menu': 'Quản lý Thực đơn & Topping',
      '/app/admin/tables-qr': 'Quản lý Bàn & Mã QR',
      '/app/admin/staff': 'Quản lý Nhân viên & Quyền',
      '/app/admin/analytics': 'Báo cáo & Analytics',
      '/app/admin/tables': 'Sơ đồ & Danh sách Bàn',
      '/app/admin/orders': 'Danh sách Đơn hàng',
      '/app/admin/quick-pos': 'Đặt món tại bàn (Quick POS)',
    };

    const currentTitle = routeTitles[currentPath] || 'Quản trị & Vận hành';

    if (currentPath === '/app/admin') {
      return [
        {
          title: (
            <span className="text-xs font-semibold text-orange-600">
              Trang chủ Admin
            </span>
          ),
        },
      ];
    }

    return [
      {
        title: (
          <button
            onClick={() => navigate('/app/admin')}
            className="text-xs font-medium text-slate-500 hover:text-orange-600 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
            title="Nhấp để quay về Trang chủ Admin"
          >
            Trang chủ Admin
          </button>
        ),
      },
      {
        title: (
          <span className="text-xs font-semibold text-orange-600">
            {currentTitle}
          </span>
        ),
      },
    ];
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="relative flex flex-col h-full bg-white border-r border-slate-200 text-slate-800 font-sans select-none">
      {/* Nút Thu Gọn Floating Toggle Button */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-5 z-50 w-7 h-7 rounded-full bg-white border border-slate-300 shadow-md text-slate-700 hover:text-orange-600 hover:border-orange-400 hover:shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95"
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 stroke-[2.5]" /> : <ChevronLeft className="w-4 h-4 stroke-[2.5]" />}
        </button>
      )}

      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center min-h-[64px]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
            collapsed && !isMobile ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
          }`}>
            <h2 className="font-bold text-sm text-slate-900 tracking-tight truncate">QUẢN TRỊ VIÊN</h2>
            <p className="text-[10px] font-medium text-slate-400 truncate">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 space-y-4 overflow-y-auto overflow-x-hidden">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <p className={`px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all duration-300 ${
              collapsed && !isMobile ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
            }`}>
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleMenuClick(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs md:text-sm transition-all duration-300 ease-in-out cursor-pointer min-h-[42px] ${
                    isActive
                      ? 'border-l-4 border-orange-600 bg-orange-50/80 text-orange-700 font-semibold shadow-2xs'
                      : 'border-l-4 border-transparent text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={collapsed && !isMobile ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-orange-600 scale-110' : 'text-slate-400'}`} />
                  <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                    collapsed && !isMobile ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Role Footer */}
      <div
        onClick={() => setIsProfileOpen(true)}
        className="p-3 border-t border-slate-100 bg-slate-50/60 cursor-pointer hover:bg-orange-50/50 transition-colors"
        title="Nhấp để mở Hồ sơ cá nhân & Đổi mật khẩu"
      >
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
            collapsed && !isMobile ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[180px] opacity-100'
          }`}>
            <p className="text-xs font-semibold text-slate-900 truncate">{userName}</p>
            <p className="text-[10px] text-slate-500 truncate">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* DESKTOP SIDEBAR - STICKY FIXED LEFT SIDEBAR */}
      <aside
        className={`sticky top-0 h-screen z-30 hidden md:block flex-shrink-0 transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0 } }}
        width={270}
      >
        {renderSidebarContent(true)}
      </Drawer>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="bg-white border-b border-slate-200 px-3 md:px-4 py-3 sticky top-0 z-20 flex items-center justify-between gap-2 md:gap-3 shadow-2xs">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {/* Hamburger Button (Mobile) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden text-slate-700 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer flex-shrink-0"
              title="Menu danh mục"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Nút Mũi Tên Quay Về Trang Chủ ADMIN (/app/admin) */}
            <button
              onClick={() => navigate('/app/admin')}
              className="md:hidden h-10 px-2.5 rounded-lg border border-slate-200 bg-slate-100/90 hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 flex-shrink-0"
              title="Quay về Trang chủ Admin"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
              <span className="hidden sm:inline">Trang chủ Admin</span>
            </button>

            {/* Global Search Input */}
            <div className="flex-1 max-w-[200px] sm:max-w-xs">
              <Input
                placeholder="Tìm kiếm hệ thống..."
                prefix={<Search className="w-3.5 h-3.5 text-slate-400 mr-1" />}
                className="rounded-lg border-slate-200 bg-slate-50 text-xs py-1.5 focus:border-orange-500"
                allowClear
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Profile Dropdown */}
            <Dropdown menu={{ items: userDropdownItems }} trigger={['click']}>
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-medium flex items-center justify-center text-xs">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{userName}</p>
                  <p className="text-[10px] text-slate-500">{userRole}</p>
                </div>
              </button>
            </Dropdown>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
          {/* Dynamic & Clickable Breadcrumb */}
          <div className="bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-2xs inline-block">
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>

          {/* Render Page Content */}
          <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 shadow-2xs min-h-[480px]">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* USER PROFILE & PASSWORD MODAL FOR ADMIN */}
      <UserProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        userRole={userRole}
        isAdmin={true}
        onUpdateName={(newName) => setUserName(newName)}
      />
    </div>
  );
};

export default AdminLayout;
