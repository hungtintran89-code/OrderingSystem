import React, { useState } from 'react';
import { Drawer, Dropdown, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Receipt,
  UtensilsCrossed,
  User,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { UserProfileModal } from '../components/UserProfileModal';

interface StaffLayoutProps {
  children?: React.ReactNode;
  staffName?: string;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({
  children,
  staffName = 'Nguyễn Văn Phục Vụ',
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname || '/staff';

  const menuItems = [
    { key: '/staff/tables', icon: LayoutGrid, label: 'Sơ đồ & Danh sách Bàn' },
    { key: '/staff/orders', icon: Receipt, label: 'Danh sách Đơn hàng' },
    { key: '/staff/quick-pos', icon: UtensilsCrossed, label: 'Đặt món tại bàn (Quick POS)' },
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  // Handle Staff Logout
  const handleLogout = () => {
    localStorage.clear();
    message.success('Đã đăng xuất thành công!');
    navigate('/login');
  };

  const staffDropdownItems = [
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
            <h2 className="font-bold text-sm text-slate-900 tracking-tight truncate">POS PHỤC VỤ</h2>
            <p className="text-[10px] font-medium text-slate-400 truncate">Staff Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.key || (currentPath === '/staff' && item.key === '/staff/tables');
          return (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs md:text-sm transition-all duration-300 ease-in-out cursor-pointer min-h-[44px] ${
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
      </nav>

      {/* Staff User Footer */}
      <div
        onClick={() => setIsProfileOpen(true)}
        className="p-3 border-t border-slate-100 bg-slate-50/60 cursor-pointer hover:bg-orange-50/50 transition-colors"
        title="Nhấp để mở Hồ sơ cá nhân & Đổi mật khẩu"
      >
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {staffName.slice(0, 2).toUpperCase()}
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
            collapsed && !isMobile ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[180px] opacity-100'
          }`}>
            <p className="text-xs font-semibold text-slate-900 truncate">{staffName}</p>
            <p className="text-[10px] text-slate-500 truncate">Nhân viên POS / Phục vụ</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`relative z-30 hidden md:block transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-60'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        bodyStyle={{ padding: 0 }}
        width={260}
      >
        {renderSidebarContent(true)}
      </Drawer>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="bg-white border-b border-slate-200 px-3 md:px-4 py-3 sticky top-0 z-20 flex items-center justify-between gap-2 md:gap-3 shadow-2xs">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden text-slate-700 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer flex-shrink-0"
              title="Menu danh mục"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Nút Mũi Tên Quay Về Trang Chủ STAFF (/staff) */}
            <button
              onClick={() => navigate('/staff')}
              className="md:hidden h-10 px-2.5 rounded-lg border border-slate-200 bg-slate-100/90 hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 flex-shrink-0"
              title="Quay về Trang chủ POS"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
              <span className="hidden sm:inline">Trang chủ POS</span>
            </button>

            <h2 className="font-semibold text-xs sm:text-base text-slate-900 truncate">Giao diện Phục vụ</h2>
          </div>

          {/* Profile Dropdown */}
          <div className="flex items-center gap-3">
            <Dropdown menu={{ items: staffDropdownItems }} trigger={['click']}>
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-medium flex items-center justify-center text-xs">
                  {staffName.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{staffName}</p>
                  <p className="text-[10px] text-slate-500">Nhân viên POS</p>
                </div>
              </button>
            </Dropdown>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* USER PROFILE & PASSWORD MODAL FOR STAFF */}
      <UserProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={staffName}
        userRole="Nhân viên POS / Phục vụ"
        isAdmin={false}
      />
    </div>
  );
};

export default StaffLayout;
