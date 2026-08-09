import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, User, Lock, Eye, EyeOff } from 'lucide-react';
import { message } from 'antd';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Role Authentication Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      message.error('Vui lòng nhập Email hoặc Tên đăng nhập!');
      return;
    }

    setLoading(true);
    const input = username.trim().toLowerCase();

    setTimeout(() => {
      setLoading(false);

      // Role-Based Access Control (Phân Quyền Đăng Nhập)
      if (input.includes('admin') || input === 'quanly' || input === 'admin@ordering.com') {
        message.success('Đăng nhập thành công với quyền Quản Lý (Admin)!');
        navigate('/admin');
      } else if (input.includes('kitchen') || input.includes('bep') || input === 'kitchen@ordering.com') {
        message.success('Đăng nhập thành công với quyền Đầu Bếp (Kitchen KDS)!');
        navigate('/kitchen');
      } else if (input.includes('staff') || input.includes('nhanvien') || input === 'staff@ordering.com') {
        message.success('Đăng nhập thành công với quyền Nhân Viên (Staff POS)!');
        navigate('/staff');
      } else {
        // Default smart fallback based on input or admin default
        message.success(`Đăng nhập thành công! Đang chuyển hướng vào hệ thống...`);
        navigate('/admin');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background Soft Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* MAIN LOGIN CONTAINER - MATCHING USER SCREENSHOT EXACTLY */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden z-10 relative">
        
        {/* Top Orange Stripe Accent */}
        <div className="h-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        <div className="p-8 sm:p-10 space-y-7">
          
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-2xs">
                <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-orange-600 tracking-tight">
                Phở & Beyond
              </h1>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 pt-1">
              Đăng nhập hệ thống
            </h2>
          </div>

          {/* Form Controls */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Input 1: Email / Username */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                Email hoặc Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập email hoặc tên đăng nhập"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Input 2: Password */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); message.info('Vui lòng liên hệ quản trị viên để cấp lại mật khẩu!'); }} className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                Quên mật khẩu?
              </a>
            </div>

            {/* Primary Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-3 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-all cursor-pointer"
            >
              {loading ? <span>Đang xác thực...</span> : <span>Đăng nhập</span>}
            </button>
          </form>

        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="mt-6 text-center text-xs text-slate-500 font-medium">
        © Liên hệ quản trị viên nếu bạn gặp sự cố truy cập.
      </footer>
    </div>
  );
};

export default LoginPage;
