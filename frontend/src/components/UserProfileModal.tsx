import React, { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { User, Lock, Shield, Eye, EyeOff, Save, CheckCircle2, LockKeyhole } from 'lucide-react';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userRole: string;
  isAdmin: boolean;
  onUpdateName?: (newName: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  open,
  onClose,
  userName,
  userRole,
  isAdmin,
  onUpdateName,
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PASSWORD'>('PROFILE');
  const [displayName, setDisplayName] = useState(userName);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setDisplayName(userName);
  }, [userName]);

  // Handle Save Name (Admin Only)
  const handleSaveName = () => {
    if (!displayName.trim()) {
      message.error('Tên người dùng không được để trống!');
      return;
    }
    if (onUpdateName) {
      onUpdateName(displayName.trim());
      message.success('Đã cập nhật tên tài khoản thành công!');
    }
  };

  // Handle Change Password (Both Admin & Staff)
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      message.error('Vui lòng nhập mật khẩu hiện tại để xác thực!');
      return;
    }
    if (!newPassword) {
      message.error('Vui lòng nhập mật khẩu mới!');
      return;
    }
    if (newPassword.length < 6) {
      message.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('Mật khẩu mới và Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    // Success Password Update Reset
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    message.success('Đã đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.');
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
      className="rounded-3xl overflow-hidden font-sans"
    >
      <div className="pt-2 pb-1 space-y-5">
        
        {/* Header Avatar & Role */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white font-black flex items-center justify-center text-base shadow-sm flex-shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 leading-tight">{displayName}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 font-bold px-2 py-0.5 rounded-md border border-orange-200/80 mt-1">
              <Shield className="w-3 h-3 text-orange-600" /> {userRole}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            onClick={() => setActiveTab('PASSWORD')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'PASSWORD'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LockKeyhole className="w-3.5 h-3.5" />
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {/* TAB 1: PROFILE INFO */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Tên hiển thị tài khoản
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  readOnly={!isAdmin}
                  disabled={!isAdmin}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                    isAdmin
                      ? 'bg-white border-slate-200 focus:border-orange-500 text-slate-900'
                      : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
                {isAdmin && (
                  <button
                    onClick={handleSaveName}
                    className="h-10 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu tên</span>
                  </button>
                )}
              </div>

              {/* Status Note for Staff */}
              {!isAdmin && (
                <p className="text-[11px] text-amber-800 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 mt-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Tên tài khoản nhân viên do Quản lý cấp cố định, bạn chỉ được phép đổi mật khẩu.</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Vai trò hệ thống
              </label>
              <input
                type="text"
                value={userRole}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        )}

        {/* TAB 2: CHANGE PASSWORD */}
        {activeTab === 'PASSWORD' && (
          <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
            
            {/* Input 1: Old Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu hiện tại (Xác thực 1 lần)
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cũ của bạn"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 outline-none focus:bg-white focus:border-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Input 2: New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu mới (Lần 1)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 outline-none focus:bg-white focus:border-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Input 3: Confirm New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Xác nhận mật khẩu mới (Lần 2)
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 outline-none focus:bg-white focus:border-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Password Change Button */}
            <button
              type="submit"
              className="w-full h-11 mt-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận Đổi Mật Khẩu</span>
            </button>
          </form>
        )}

      </div>
    </Modal>
  );
};
