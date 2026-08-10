import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, User, Lock, Eye, EyeOff, Info } from 'lucide-react';
import { message } from 'antd';
import { authApi } from '../../../../api/authApi';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Role Authentication Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      message.error('Vui lòng nhập email hoặc tên đăng nhập!');
      return;
    }
    if (!password) {
      message.error('Vui lòng nhập mật khẩu!');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate with Backend Spring Boot API
      const authData = await authApi.login({ username: username.trim(), password });
      setLoading(false);

      if (authData && authData.token) {
        message.success(`Đăng nhập thành công! Chào mừng ${authData.fullName || authData.username}.`);
        const userRole = (authData.role || '').toUpperCase();
        if (['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
          navigate('/app/admin');
        } else if (userRole.includes('KITCHEN') || userRole.includes('CHEF')) {
          navigate('/app/kitchen');
        } else {
          navigate('/app/staff');
        }
      }
    } catch {
      // Login failed: Error message toast is displayed by Axios interceptor.
      // STAY ON /app/login! DO NOT NAVIGATE ANYWHERE!
      setLoading(false);
    }
  };

  // Forgot Password Click Handler
  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    message.info({
      content: 'Vui lòng liên hệ Quản trị viên (Admin) để được cấp lại mật khẩu!',
      duration: 4,
    });
  };

  return (
    <div className="bg-[#F3F4F6] min-h-screen flex items-center justify-center font-sans text-[#111827] p-4 select-none relative overflow-hidden">
      
      {/* 🟠 Subtle Soft Orange Ambient Glow - Top Left Corner */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-[#F97316]/12 rounded-full blur-[140px] pointer-events-none" />

      {/* 🟠 Subtle Soft Amber Ambient Glow - Bottom Right Corner */}
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-amber-400/15 rounded-full blur-[140px] pointer-events-none" />

      <main className="w-full max-w-md relative z-10">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(249,115,22,0.07)] p-8 sm:p-10 w-full border border-gray-100/90 relative overflow-hidden backdrop-blur-xs">
          {/* Decorative Top Accent Line */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#F97316] to-orange-400" />

          {/* Brand Header */}
          <div className="text-center mb-8 mt-2">
            <div className="flex items-center justify-center gap-2 mb-1 text-[#F97316]">
              <Utensils className="w-7 h-7 text-[#F97316]" />
              <h1 className="font-extrabold text-2xl tracking-tight text-[#F97316]">Phở &amp; Beyond</h1>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-4">Đăng nhập hệ thống</h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email/Username Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="username">
                Email hoặc Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4.5 h-4.5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập email hoặc tên đăng nhập"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] text-sm transition-all bg-gray-50/50 text-gray-900 outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] text-sm transition-all bg-gray-50/50 text-gray-900 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#F97316] transition-colors cursor-pointer"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer font-medium text-xs sm:text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#F97316] focus:ring-[#F97316] border-gray-300 rounded cursor-pointer"
                />
                <span className="ml-2">Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs sm:text-sm font-semibold text-[#F97316] hover:text-[#EA580C] transition-colors cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-md shadow-orange-500/20 text-sm font-bold text-white bg-[#F97316] hover:bg-[#EA580C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316] transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Text */}
        <div className="mt-6 text-center text-xs sm:text-sm text-gray-500 flex items-center justify-center gap-1.5">
          <Info className="w-4 h-4 text-gray-400" />
          <span>Liên hệ quản trị viên nếu bạn gặp sự cố truy cập.</span>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
