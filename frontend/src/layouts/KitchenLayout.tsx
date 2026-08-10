import React, { useState, useEffect } from 'react';
import { Tag, Dropdown, message } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { ChefHat, User, LogOut } from 'lucide-react';
import { KitchenKiosk } from '../pages/kitchen/KitchenKiosk';
import { UserProfileModal } from '../components/UserProfileModal';

interface KitchenLayoutProps {
  children?: React.ReactNode;
  kitchenName?: string;
}

export const KitchenLayout: React.FC<KitchenLayoutProps> = ({
  children,
  kitchenName = 'Bếp Chính - Khu A',
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
          ' - ' +
          now.toLocaleDateString('vi-VN')
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Kitchen Logout Handler
  const handleLogout = () => {
    localStorage.clear();
    message.success('Đã đăng xuất tài khoản Bếp thành công!');
    navigate('/app/login');
  };

  const kitchenDropdownItems = [
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      {/* 1. KITCHEN LIGHT THEME TOPBAR */}
      <header className="bg-white border-b border-slate-200 px-3 md:px-4 py-3 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Kitchen Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm md:text-base text-slate-900 leading-tight">{kitchenName}</h1>
                <Tag color="orange" className="text-[10px] font-semibold border-none px-2 py-0.5 rounded-md">
                  KDS REALTIME
                </Tag>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{currentTime || '12:00:00'}</p>
            </div>
          </div>

          {/* Right: Kitchen User Profile Dropdown & Logout (Đã gỡ bỏ KDS Live Connected) */}
          <div className="flex items-center gap-3">
            <Dropdown menu={{ items: kitchenDropdownItems }} trigger={['click']}>
              <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                  KB
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">Đầu Bếp - Khu A</p>
                  <p className="text-[10px] text-slate-500">Tài khoản Bếp KDS</p>
                </div>
              </button>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* 2. MAIN KITCHEN KIOSK DISPLAY AREA */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {children || <Outlet /> || <KitchenKiosk />}
      </main>

      {/* USER PROFILE & PASSWORD CHANGE MODAL FOR KITCHEN CHEF */}
      <UserProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName="Đầu Bếp - Khu A"
        userRole="Tài khoản Bếp KDS"
        isAdmin={false}
      />
    </div>
  );
};

export default KitchenLayout;
